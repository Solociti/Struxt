import { knex } from "../../utils/database";
import { FormSettings, toFormSettingsRow } from "../convertRows";

export function defaultFormSettings(
  siteId: number,
  siteEnv: "production" | "staging",
  formName: string
): FormSettings {
  return {
    siteId,
    siteEnv,
    formName,
    enabled: true,
    sendEmail: false,
    emailTo: "",
    emailSubject: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Save new form settings to database
 *
 * @param settings
 * @returns
 */
export async function saveNewFormSettings(
  settings: FormSettings
): Promise<number> {
  const row = toFormSettingsRow(settings);
  const [newId] = await knex("pub_form_settings").insert(row);
  return newId;
}

/**
 * Save the form settings to database
 *
 * @param settings
 * @returns
 */
export async function saveFormSettings(settings: FormSettings) {
  if (typeof settings.id !== "number") {
    throw new Error("Invalid settings id");
  }

  const row = toFormSettingsRow(settings);

  const result = await knex
    .table("pub_form_settings")
    .where({ id: settings.id })
    .update(row);

  if (result === 0) {
    return false;
  }
  return true;
}
