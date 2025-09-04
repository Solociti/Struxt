import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getMongoClient, dbName as mongoDbName } from "server/database/mongodb";
import { z } from "zod";
import { setupLLM } from "./setupLLM";
import { AiMessageContext } from "common/models/aiPilot/tools/Context";

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
  { llmModel, temperature }: { llmModel: string; temperature?: number }
) {
  // TODO: load the project and chat context

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

  /**
   * Setup the main agent that handles all tasks.
   */
  const agent = createReactAgent({
    name: "ai_pilot_agent",
    prompt: [
      "You are an AI assistant specializing in web development and digital marketing for a drag-and-drop website builder.",
      "Help users create and optimize websites through code generation, SEO, marketing, UX design, and content strategy.",
      "You're open to discussing any concept that might inspire web projects.",
    ].join("\n"),
    tools: [
      tool(
        async (input: any) => {
          console.log("Generating code for:", input);
          return `Generated code: ${input.code}`;
        },
        {
          name: "generate_code",
          description: "Generate code snippets based on the input.",
          schema: z.object({
            code: z.string().describe("The generated code snippet"),
          }),
        }
      ),
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

      if (context) {
        content = `Context: ${JSON.stringify(context)}\n\nMessage: ${message}`;
      }

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
