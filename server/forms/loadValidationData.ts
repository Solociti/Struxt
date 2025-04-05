import { getTable } from "../utils/database";
import { FormValidation } from "./validateFormData";

export async function loadValidationData(
  projectId: string,
  siteEnv: "staging" | "production",
  formName: string,
  getArchived: boolean = false
): Promise<FormValidation[]> {
  const table = getTable("pub_form_validation");

  const q = table.where({
    site_id: projectId,
    site_env: siteEnv,
    form_name: formName,
  });

  if (!getArchived) {
    q.andWhere({ archived: false });
  }

  const rows = await q.select("*");

  return rows.map((row) => ({
    id: row.id,
    projectId: row.site_id,
    siteEnv: row.site_env,
    formName: row.form_name,
    fieldName: row.field_name,
    type: row.type,
    required: row.required,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
