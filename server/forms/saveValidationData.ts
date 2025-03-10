import { knex } from "../utils/database.ts";
import { loadValidationData } from "./loadValidationData.ts";
import { FormValidation } from "./validateFormData.ts";

/**
 * Save the validation data to the database
 *
 * @param projectId
 * @param siteEnv
 * @param validation
 */

export async function saveValidationData(validation: FormValidation[]) {
  if (!validation.length) {
    return;
  }

  const updated = new Date();
  for (const v of validation) {
    v.updatedAt = updated;
  }

  const existingValidation = await loadValidationData(
    validation[0].projectId,
    validation[0].siteEnv,
    validation[0].formName,
    true
  );

  await knex.transaction(async (trx) => {
    const updatedIds = new Set<number>();

    for (const v of validation) {
      // check if there is an existing validation row
      const ev = existingValidation.find((ev) => ev.fieldName === v.fieldName);

      if (ev && ev.id) {
        const success = await trx
          .table("pub_form_validation")
          .where({
            id: ev.id,
          })
          .update({
            type: v.type,
            required: v.required,
            updated_at: v.updatedAt,
            archived: false,
          });

        if (success) {
          updatedIds.add(parseInt(ev.id));
          continue;
        }
      }

      // insert the new validation row
      const [rowId] = await trx
        .table("pub_form_validation")
        .insert({
          site_id: v.projectId,
          site_env: v.siteEnv,
          form_name: v.formName,
          field_name: v.fieldName,
          type: v.type,
          required: v.required,
          created_at: v.createdAt,
          updated_at: v.updatedAt,
        })
        .onConflict()
        .merge({
          site_id: v.projectId,
          site_env: v.siteEnv,
          form_name: v.formName,
          field_name: v.fieldName,
          type: v.type,
          required: v.required,
          updated_at: v.updatedAt,
          archived: false,
        });

      updatedIds.add(rowId);
    }

    // archive any rows that weren't updated
    await trx
      .table("pub_form_validation")
      .whereNotIn("id", Array.from(updatedIds))
      .andWhere({
        site_id: validation[0].projectId,
        site_env: validation[0].siteEnv,
        form_name: validation[0].formName,
        archived: false,
      })
      .update({
        archived: true,
        updated_at: updated,
      });
  });
}
