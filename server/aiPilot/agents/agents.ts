import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { AiMessageContext } from "common/models/aiPilot/tools/Context";
import { getMongoClient, dbName as mongoDbName } from "server/database/mongodb";
import { setupContextTools } from "../tools/contextTools";
import { getClientTools } from "../tools/setupClientTools";
import { setupLLM } from "./setupLLM";

/**
 * Setup the AI Pilot agent with all of the required tools.
 *
 * @param chatId
 * @param projectId
 * @param llmModel - The LLM model to use (e.g., "openai:gpt-4o", "anthropic:claude-3-5-sonnet-20240620")
 * @param temperature - The temperature setting for the LLM (0-1)
 * @returns
 */
export async function setupAiPilot(
  { chatId, projectId }: { chatId: string; projectId: string },
  { llmModel, temperature }: { llmModel: string; temperature?: number },
  clientRequest: <K extends keyof AiPilotChatEvents["serverRequests"]>(
    name: K,
    ...args: Parameters<AiPilotChatEvents["serverRequests"][K]>
  ) => ReturnType<AiPilotChatEvents["serverRequests"][K]>,
  toolCall: (name: string, data: any) => void
) {
  const langSmithConfig = {
    projectName: `ai-pilot-${projectId}`,
    sessionId: chatId,
    thread_id: chatId,
    metadata: {
      chatId,
      projectId,
      environment: process.env.NODE_ENV || "development",
    },
  };

  // Setup the LLM based on user selection
  const llm = await setupLLM(llmModel, {
    temperature: temperature || 0.5,
  });

  const mongoClient = await getMongoClient();

  // Setup MongoDB checkpoint saver for conversation history
  const checkPointer = new MongoDBSaver({
    client: mongoClient,
    dbName: mongoDbName,
    checkpointCollectionName: "ai_pilot_checkpoints",
    checkpointWritesCollectionName: "ai_pilot_checkpoint_writes",
  });

  const clientTools = await getClientTools(llmModel);
  const contextTools = setupContextTools(projectId, toolCall);

  /**
   * Setup the main agent that handles all tasks.
   */
  const agent = createReactAgent({
    prompt: [
      "You are an AI assistant specializing in web development and digital marketing for a drag-and-drop website builder (Struxt - a modified version of GrapesJS).",
      "Help users create and optimize websites through code generation, SEO, UX design, and content strategy.",
      "You're open to discussing any concept that might inspire web projects.",
      "There is tools setup for managing project context. Save important details about the project.",
    ].join("\n"),
    tools: [
      ...contextTools.tools,
      ...clientTools.map((t) => {
        return tool(
          async (input) => {
            return clientRequest(t.name, input as any);
          },
          {
            name: t.name,
            description: t.description,
            schema: t.schema,
          }
        );
      }),
    ],
    llm,
    checkpointSaver: checkPointer,
  });

  return {
    getAgent() {
      return agent;
    },

    async streamResponse(message: string, context: AiMessageContext) {
      let content = message;

      const contextKeysResult = await contextTools.getContextKeys();
      const contextKeys = JSON.stringify(
        contextKeysResult.success ? contextKeysResult.value : []
      );

      content = [
        `ProjectContextKeys: ${contextKeys}`,
        `Context: ${JSON.stringify(context || {})}`,
        `Message: ${message}`,
      ].join("\n\n");

      return await agent.stream(
        {
          messages: [
            new HumanMessage({
              content,
            }),
          ],
        },
        {
          streamMode: "messages",
          configurable: {
            ...langSmithConfig,
            runName: `chat-${chatId.substring(0, 10)}`,
          },
        }
      );
    },
  };
}
