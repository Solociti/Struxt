import { initChatModel } from "langchain/chat_models/universal";

/**
 * Setup the llm
 *
 * @param modelName
 * @param options
 * @returns
 */
export async function setupLLM(
  modelName: string,
  options: { temperature: number }
) {
  // get the API key based on the model name
  let apiKey = "";
  if (modelName.startsWith("openai:")) {
    apiKey = process.env.OPENAI_API_KEY || "";
  } else if (modelName.startsWith("anthropic:")) {
    apiKey = process.env.ANTHROPIC_API_KEY || "";
  } else if (modelName.startsWith("google:")) {
    apiKey = process.env.GOOGLE_API_KEY || "";
  } else {
    throw new Error(`Unsupported model: ${modelName}`);
  }

  const defaultOptions = {
    timeout: 10000,
    maxTokens: 1000,
    temperature: 0,
  };

  return await initChatModel("openai:gpt-4o", {
    ...defaultOptions,
    ...options,
    apiKey,
  });
}
