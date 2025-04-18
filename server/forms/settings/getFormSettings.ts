import { ModelAsDocument } from "common/models/Model";
import { FormSettingsModel } from "common/models/projects/forms/FormSettingsModel";
import { getCollection } from "server/database/mongodb";

/**
 * Load the settings for the given form
 *
 * @param projectId
 * @param projectEnv
 * @param formName
 * @returns
 */
export async function getFormSettings(
  projectId: string,
  projectEnv: "production" | "staging",
  formName: string
): Promise<FormSettingsModel | null> {
  const collection = await getCollection("form_settings");

  const doc = await collection.findOne<ModelAsDocument<FormSettingsModel>>({
    projectId,
    projectEnv,
    formName,
  });
  if (!doc) {
    return null;
  }
  if (doc._id) {
    delete doc._id;
  }

  return new FormSettingsModel(doc);
}
