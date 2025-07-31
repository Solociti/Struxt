import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { setupLLM } from "./setupLLM";

/**
 * Setup the AI Pilot agents with all of the required tools.
 *
 * @param chatId
 * @param projectId
 * @returns
 */
export async function setupAiPilot(chatId: string, projectId: string) {
  // TODO: load the project and chat context

  // setup the LLMs
  const gptStrict = await setupLLM("openai:gpt-4o", {
    temperature: 0.1,
  });

  const gptLoose = await setupLLM("openai:gpt-4o", {
    temperature: 0.8,
  });

  const claudeStrict = await setupLLM("anthropic:claude-3-5-sonnet-20240620", {
    temperature: 0.3,
  });

  /**
   * Setup the code agent.
   */
  const codeAgent = createReactAgent({
    name: "code_agent",
    prompt:
      "You are a code assistant that generates html, css and in some cases javascript for websites.",
    tools: [
      tool(
        async (input: any) => {
          console.log("Generating code for:", input);

          return `Generated code: ${input}`;
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
    llm: claudeStrict,
  });

  /**
   * Setup the general chat agent.
   */
  const chatAgent = createReactAgent({
    name: "chat_agent",
    prompt:
      "You are a helpful assistant that specializes in generating text, answers, and explanations.",
    tools: [
      tool(
        async (input: any) => {
          console.log("Generating response for:", input);

          return `Response: ${input}`;
        },
        {
          name: "generate_response",
          description: "Generate a response based on the input.",
          schema: z.object({
            response: z.string().describe("The generated response"),
          }),
        }
      ),
    ],
    llm: gptLoose,
  });

  /**
   * Supervisor that manages all of the agents.
   */
  const supervisor = createSupervisor({
    agents: [codeAgent, chatAgent],
    llm: gptStrict,
    prompt: [
      "You are a supervisor that manages multiple agents to handle different tasks.",
      "- A code_agent that specializes in writing code.",
      "- A chat_agent that can help generating text tasks.",
      "- For knowledge tasks, just respond with the answer.",
    ].join("\n"),
  }).compile();

  return {
    async streamResponse(message: string) {
      return await supervisor.stream({
        messages: [
          new HumanMessage({
            content: message,
          }),
        ],
      });
    },
  };
}
