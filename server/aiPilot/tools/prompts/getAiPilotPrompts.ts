import { AiPilotPrompts } from "common/models/aiPilot/tools/AiPilotPrompts";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Get the tool descriptions for the AI Pilot tools.
 *
 * Only overwrites are stored in the settings,
 * so this method merges the defaults with any overwrites.
 *
 * @param model Optionally provide the model name for model-specific descriptions
 */
export async function getAiPilotPrompts(
  vendor?: string,
  model?: string
): Promise<AiPilotPrompts> {
  const descriptions = new AiPilotPrompts();

  // Load the prompt overrides from the database
  const collection = await getCollection<PromptOverrides>("ai_pilot_prompts");

  const cursor = collection.find(
    {
      "archived.active": { $ne: true },
    },
    {
      sort: {
        "created.date": 1,
      },
    }
  );

  const docs = await toArray(cursor);
  const overrides = docs.map((d) => new PromptOverrides(d));

  descriptions.applyOverrides(overrides, vendor || "", model || "");

  return descriptions;
}

/**
 * Get all prompt overrides from the database
 *
 * @returns
 */
export async function getAllAiPilotPromptOverrides(): Promise<
  PromptOverrides[]
> {
  const collection = await getCollection<PromptOverrides>("ai_pilot_prompts");

  const cursor = collection.find(
    {
      "archived.active": { $ne: true },
    },
    {
      sort: {
        "created.date": 1,
      },
    }
  );

  const docs = await toArray(cursor);
  const overrides = docs.map((d) => new PromptOverrides(d));

  return overrides;
}
