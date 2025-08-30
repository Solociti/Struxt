import { BaseMessage } from "@langchain/core/messages";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { customError } from "common/custom-error/custom-error";
import {
  AiChatContents,
  AiChatMessage,
  UserChatMessage,
} from "common/models/aiPilot/ChatMessage";
import { roles } from "common/models/user/Roles";
import { randomUUID } from "node:crypto";
import { registerObserver } from "server/ws/observers";
import z from "zod";
import { setupAiPilot } from "./agents/agents";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

registerObserver<AiPilotChatEvents>(
  "aiPilot:chat:open",
  async (event, query) => {
    // This starts when any user opens the AI Pilot chat in the UI
    // This does not mean that the connected user is the editor of the session.
    // The active editor will have other events registered to receive server requests.

    const { user, sendRequest } = event;

    const { projectId, chatId } = z
      .object({
        projectId: z.string().min(6, "Project ID is required"),
        chatId: z.string().min(6, "Chat ID is required"),
      })
      .parse(query);

    // check if the user has access to the project
    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(403, "You do not have access to this project");
    }

    const chat = await setupAiPilot(
      { chatId, projectId },
      {
        llmModel: "openai:gpt-4o",
        temperature: 0.5,
      }
    );

    // get the chat details from database

    // register a listener in redis pub/sub for chat changes

    return {
      onUnregister() {
        // TODO: Implement any cleanup logic if necessary
      },

      onClientRequests: {
        "user-message": async (request) => {
          const { message } = z
            .object({
              message: z.string().min(1, "Message cannot be empty"),
            })
            .parse(request);

          // Handle the user message
          const msgId = await randomUUID();
          const userMessage = new UserChatMessage({
            uuid: msgId,
            chatId,
            content: message,
            created: {
              date: Math.floor(Date.now() / 1000),
              userId: user.id,
              displayName: user.name,
            },
          });
          event.send({
            chatId,
            messageId: msgId,
            message: userMessage,
          });

          await sleep(25);

          const responseId: string = await randomUUID();
          const responseMessage = new AiChatMessage({
            uuid: responseId,
            chatId,
            metadata: {},
          });

          // TODO: Save the user message to the database

          event.send({
            chatId,
            messageId: responseId,
            message: responseMessage,
          });
          await sleep(25);

          const chunks = [];

          // Handle the user message
          const stream = await chat.streamResponse(message);

          // consider listening to multiple event types and tracking the states
          // to know what to send to the client
          for await (const [msg, details] of stream) {
            chunks.push({ msg, details });

            const { content, shouldSend } = processStreamChunk(
              msg as any,
              details
            );

            if (shouldSend) {
              responseMessage.contents.push(content);

              event.send({
                chatId,
                messageId: responseId,
                content,
                chunks,
              });
              await sleep(10);
            }

            // TODO: Save the AI message chunk to the database
          }

          return {
            success: true,
            message: responseMessage,
          };
        },
      },
    };
  }
);

interface LangGraphStepDetails extends Record<string, any> {
  tags?: string[];
  langgraph_step?: number;
  langgraph_node?: string;
  langgraph_triggers?: string[];
  langgraph_path?: string[];
  langgraph_checkpoint_ns?: string;
  __pregel_task_id?: string;
  checkpoint_ns?: string;
  ls_provider?: string;
  ls_model_name?: string;
  ls_model_type?: string;
  ls_temperature?: number;
  ls_max_tokens?: number;
}

/**
 * Convert the langchain stream chunk into the chat content format.
 *
 * @param msg
 */
function processStreamChunk(
  msg: BaseMessage,
  details: LangGraphStepDetails
): {
  content: AiChatContents;
  shouldSend: boolean;
} {
  const msgType = msg.getType();
  const hasContent =
    typeof msg.content === "string" && msg.content.trim().length > 0;

  const shouldSend = Boolean(hasContent || msgType === "tool");

  const category: AiChatContents["category"] = (() => {
    if (msgType === "tool") {
      return "tool_call";
    }
    if (msgType === "ai" && hasContent) {
      return "message";
    }
    return "unknown";
  })();

  const content: string = extractContentFromMessage(msg);
  const contentId =
    msg.id || `${details.langgraph_step}-${details.langgraph_node}`;
  const usage = (msg as any).usage_metadata || { total_tokens: 0 };

  const action = "";

  return {
    content: {
      contentId,
      content,
      category,
      action,
      msgType,
      agentId: "supervisor",
      totalTokens: usage.total_tokens || 0,
    },
    shouldSend: shouldSend,
  };
}

/**
 * Extract readable content from various LangChain message formats
 * @param msg The BaseMessage to extract content from
 */
function extractContentFromMessage(msg: BaseMessage): string {
  if (typeof msg.content === "string") {
    return msg.content;
  }

  if (Array.isArray(msg.content)) {
    for (const part of msg.content) {
      if (!part) continue;

      if (typeof part === "string") {
        return part;
      }

      if (
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
    }
  }

  return "";
}
