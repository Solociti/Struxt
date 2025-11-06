import { customError } from "common/custom-error/custom-error";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import { getCollection } from "server/database/mongodb";

/**
 * Save the AI Pilot model
 *
 * @param model
 * @returns
 */
export async function saveAiPilotModel(
  model: AiPilotModel
): Promise<{ success: boolean }> {
  if (!model.id) {
    throw customError(400, "Model ID is required");
  }

  if (model.isDefault && model.disabled.active) {
    throw customError(400, "A default model cannot be disabled.");
  }

  const collection = await getCollection<AiPilotModel>("ai_pilot_models");
  const result = await collection.updateOne(
    {
      id: model.id,
    },
    {
      $set: model,
    },
    {
      upsert: true,
    }
  );

  if (model.isDefault) {
    // ensure only one model is the default
    await collection.updateMany(
      {
        id: { $ne: model.id },
        isDefault: true,
      },
      {
        $set: { isDefault: false },
      }
    );
  }

  return { success: result.acknowledged };
}
