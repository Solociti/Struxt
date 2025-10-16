import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import { AiMessageContext } from "common/models/aiPilot/tools/Context";
import { tools } from "server/aiPilot/metrics";
import { setupMemoryTools } from "server/aiPilot/tools/contextTools";
import { getAiPilotPrompts } from "server/aiPilot/tools/prompts/getAiPilotPrompts";
import { getClientTools } from "server/aiPilot/tools/setupClientTools";
import { getMongoClient, dbName as mongoDbName } from "server/database/mongodb";
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
  { llmModel, temperature }: { llmModel: AiPilotModel; temperature?: number },
  clientRequest: <K extends keyof AiPilotChatEvents["serverRequests"]>(
    name: K,
    ...args: Parameters<AiPilotChatEvents["serverRequests"][K]>
  ) => ReturnType<AiPilotChatEvents["serverRequests"][K]>,
  toolCall: (name: string, data: any) => void,
  tokenUsage: (tokens: {
    prompt: number;
    completion: number;
    total: number;
  }) => void
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
  const llm = await setupLLM(llmModel.id, {
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

  const { vendor, model } = llmModel.splitId();
  const descriptions = await getAiPilotPrompts(vendor, model);

  const clientTools = getClientTools(llmModel.id, descriptions);
  const memoryTools = setupMemoryTools(projectId, descriptions, toolCall);

  /**
   * Setup the main agent that handles all tasks.
   */
  const agent = createReactAgent({
    prompt: descriptions.agentPrompt,
    tools: [
      ...memoryTools.tools,
      ...clientTools.map((t) => {
        return tool(
          async (input) => {
            const toolStartTime = Date.now();

            try {
              // Record tool call
              tools.recordCall("client", t.name, projectId, llmModel.id);

              const result = await clientRequest(t.name, input as any);

              // Record successful tool execution
              const toolDuration = (Date.now() - toolStartTime) / 1000;
              tools.recordExecution(t.name, projectId, toolDuration);

              return result;
            } catch (error) {
              // Record tool error
              const errorType =
                error instanceof Error
                  ? error.constructor.name
                  : "UnknownError";
              tools.recordError(t.name, errorType, projectId);

              // Record execution time even for failed tools
              const toolDuration = (Date.now() - toolStartTime) / 1000;
              tools.recordExecution(t.name, projectId, toolDuration);

              throw error;
            }
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

      const memoryKeysResult = await memoryTools.getMemoryKeys();
      const memoryKeys = JSON.stringify(
        memoryKeysResult.success ? memoryKeysResult.value : []
      );

      content = [
        `ProjectMemoryKeys: ${memoryKeys}`,
        `EditorContext: ${JSON.stringify(context || {})}`,
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
          callbacks: [
            {
              handleLLMEnd(output) {
                // get the total token usage from the output
                const llmOutput = output.llmOutput || {};
                const usage = llmOutput.tokenUsage;
                if (!usage) {
                  return;
                }

                const prompt = usage.promptTokens || 0;
                const completion = usage.completionTokens || 0;
                const total = usage.totalTokens || 0;
                tokenUsage({
                  prompt,
                  completion,
                  total,
                });
              },
            },
          ],
          configurable: {
            ...langSmithConfig,
            runName: `chat-${chatId.substring(0, 10)}`,
          },
        }
      );
    },
  };
}
