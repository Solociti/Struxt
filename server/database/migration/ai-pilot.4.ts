import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import { createIndex } from "../mongodb";
import { saveAiPilotModel } from "server/aiPilot/models/saveModels";

export async function up() {
  await createIndex(
    "ai_pilot_models",
    {
      id: 1,
    },
    {
      name: "id",
      unique: true,
    },
    false
  );

  await createIndex(
    "ai_pilot_prompts",
    {
      uuid: 1,
    },
    {
      name: "uuid",
      unique: true,
    },
    false
  );

  // preload the default models
  const models = [
    new AiPilotModel({
      id: "anthropic:claude-opus-4-1-20250805",
      modelName: "Opus 4.1",
      vendor: "Anthropic",
      tokenMultiplier: 2.25,
    }),
    new AiPilotModel({
      id: "anthropic:claude-opus-4-20250514",
      modelName: "Opus 4",
      vendor: "Anthropic",
      tokenMultiplier: 2.25,
    }),
    new AiPilotModel({
      id: "anthropic:claude-sonnet-4-20250514",
      modelName: "Sonnet 4",
      vendor: "Anthropic",
      tokenMultiplier: 1.5,
    }),
    new AiPilotModel({
      id: "openai:gpt-5",
      modelName: "GPT-5",
      vendor: "OpenAI",
      tokenMultiplier: 1.25,
      disabled: {
        active: true,
      },
    }),
    new AiPilotModel({
      id: "openai:gpt-5-mini",
      modelName: "GPT-5 mini",
      vendor: "OpenAI",
      tokenMultiplier: 1,
      disabled: {
        active: true,
      },
    }),
    new AiPilotModel({
      id: "openai:gpt-5-nano",
      modelName: "GPT-5 nano",
      vendor: "OpenAI",
      tokenMultiplier: 0.75,
      disabled: {
        active: true,
      },
    }),
    new AiPilotModel({
      id: "openai:gpt-4.1",
      modelName: "GPT-4.1",
      vendor: "OpenAI",
      tokenMultiplier: 1.5,
    }),
    new AiPilotModel({
      id: "openai:gpt-4.1-mini",
      modelName: "GPT-4.1 mini",
      vendor: "OpenAI",
      tokenMultiplier: 1.25,
      isDefault: true,
    }),
    new AiPilotModel({
      id: "openai:gpt-4.1-nano",
      modelName: "GPT-4.1 nano",
      vendor: "OpenAI",
      tokenMultiplier: 0.75,
    }),
    new AiPilotModel({
      id: "openai:o4-mini",
      modelName: "o4-mini",
      vendor: "OpenAI",
      tokenMultiplier: 1.5,
    }),
    new AiPilotModel({
      id: "google-genai:gemini-2.5-pro",
      modelName: "Gemini 2.5 Pro",
      vendor: "Google",
      tokenMultiplier: 1.25,
    }),
    new AiPilotModel({
      id: "google-genai:gemini-2.5-flash",
      modelName: "Gemini 2.5 Flash",
      vendor: "Google",
      tokenMultiplier: 1,
    }),
  ];

  for (const model of models) {
    await saveAiPilotModel(model);
  }
}

export async function down() {}
