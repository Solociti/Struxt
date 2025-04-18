import { FormSettingsModel } from "common/models/projects/forms/FormSettingsModel";
import { getCollection } from "server/database/mongodb";

export function defaultFormSettings(
  projectId: string,
  projectEnv: "production" | "staging",
  formName: string
): FormSettingsModel {
  return new FormSettingsModel({
    projectId,
    projectEnv,
    formName,
  });
}

/**
 * Save the form settings to database
 *
 * @param settings
 * @returns
 */
export async function saveFormSettings(settings: FormSettingsModel) {
  const collection = await getCollection("form_settings");

  const result = await collection.updateOne(
    {
      projectId: settings.projectId,
      projectEnv: settings.projectEnv,
      formName: settings.formName,
    },
    {
      $set: settings,
    },
    {
      upsert: true,
    }
  );

  if (result.acknowledged) {
    return true;
  }
  return false;
}
