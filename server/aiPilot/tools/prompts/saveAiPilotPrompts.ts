import { customError } from "common/custom-error/custom-error";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";
import { getCollection } from "server/database/mongodb";
import { createSimpleId } from "server/utils/createId";

/**
 * Save the AI Pilot prompt overrides in the database
 *
 * @param prompt
 * @returns
 */
export async function saveAiPilotPrompts(
  prompt: PromptOverrides
): Promise<{ success: boolean; uuid: string }> {
  const collection = await getCollection<PromptOverrides>("ai_pilot_prompts");

  if (!prompt.uuid) {
    throw customError(400, "Prompt UUID is required to save.");
  }

  if (prompt.uuid === "new") {
    prompt.uuid = await createSimpleId("ai_pilot_prompt");
  }

  // update the doc
  await collection.updateOne(
    {
      uuid: prompt.uuid,
    },
    {
      $set: prompt,
    },
    {
      upsert: true,
    }
  );

  return { success: true, uuid: prompt.uuid };
}
