import { customError } from "common/custom-error/custom-error";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Get the available AI Pilot models
 *
 * @param allowDisabled Whether to include disabled models
 * @returns
 */
export async function getAiPilotModels(
  allowDisabled?: boolean
): Promise<AiPilotModel[]> {
  const collection = await getCollection<AiPilotModel>("ai_pilot_models");

  const filter = {};
  if (!allowDisabled) {
    Object.assign(filter, { "disabled.active": { $ne: true } });
  }

  const cursor = collection.find(filter);
  const docs = await toArray(cursor);

  return docs
    .map((doc) => new AiPilotModel(doc))
    .sort((a, b) => {
      if (a.vendor === b.vendor) {
        return a.modelName.localeCompare(b.modelName);
      }
      return a.vendor.localeCompare(b.vendor);
    });
}

/**
 * Get a specific AI Pilot model by ID
 *
 * @param id
 * @returns
 */
export async function getAiPilotModel(
  id: string,
  allowDisabled?: boolean
): Promise<AiPilotModel | null> {
  const collection = await getCollection<AiPilotModel>("ai_pilot_models");

  const filter = { id };
  if (!allowDisabled) {
    Object.assign(filter, { "disabled.active": { $ne: true } });
  }

  const doc = await collection.findOne(filter);
  if (!doc) {
    return null;
  }

  return new AiPilotModel(doc);
}

/**
 * Get the default AI Pilot model
 *
 * @returns
 */
export async function getDefaultAiPilotModel(): Promise<AiPilotModel | null> {
  const collection = await getCollection<AiPilotModel>("ai_pilot_models");

  const doc = await collection.findOne({
    isDefault: true,
    "disabled.active": { $ne: true },
  });
  if (!doc) {
    return null;
  }

  return new AiPilotModel(doc);
}

/**
 * Get the AI Pilot model by ID, or the default if not found or not provided
 *
 * @param modelId
 * @returns
 */
export async function getAiPilotModelAuto(
  modelId?: string | null
): Promise<AiPilotModel> {
  const getDefault = async () => {
    const defModel = await getDefaultAiPilotModel();

    if (!defModel) {
      throw customError(500, "Could not load the AI Pilot model.");
    }

    return defModel;
  };

  if (!modelId) {
    return await getDefault();
  }

  const model = await getAiPilotModel(modelId);
  if (!model) {
    return await getDefault();
  }

  return model;
}
