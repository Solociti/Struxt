import { knex } from "../../utils/database.ts";

/**
 * Get the project roles for the given user
 *
 * @param userId
 */
export async function getProjectRoles(userId: string) {
  const rows = await knex
    .table("user_roles")
    .where("user_id", userId)
    .select("site_id", "action");

  return rows.map((row) => ({
    projectId: row.site_id,
    action: row.action,
  }));
}
