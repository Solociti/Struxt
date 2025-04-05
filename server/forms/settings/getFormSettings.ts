import { knex } from "../../utils/database";
import { FormSettings, fromFormSettingsRow } from "../convertRows";

/**
 * Load the settings for the given form
 *
 * @param siteId
 * @param siteEnv
 * @param formName
 * @returns
 */
export async function getFormSettings(
  siteId: string,
  siteEnv: "production" | "staging",
  formName: string
): Promise<FormSettings | null> {
  const [row] = await knex
    .table("pub_form_settings")
    .where({
      site_id: siteId,
      site_env: siteEnv,
      form_name: formName,
    })
    .limit(1);

  if (!row) {
    return null;
  }

  return fromFormSettingsRow(row);
}
