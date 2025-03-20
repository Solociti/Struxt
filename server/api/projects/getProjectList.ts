import { knex } from "../../utils/database.ts";

/**
 * Get the list of projects for a user
 *
 * @param userId
 * @returns
 */
export async function getProjectsForUser(userId: string) {
  const rows = await knex
    .table("sites")
    .innerJoin("user_roles", {
      "sites.id": "user_roles.site_id",
    })
    .select("sites.id", "sites.name", "sites.description")
    .where("user_roles.user_id", userId);

  return rows;
}

/**
 * Get the list of projects for a struxt admin
 *
 * @returns
 */
export async function getProjectsAdmin() {
  const rows = await knex
    .table("sites")
    .select("sites.id", "sites.name", "sites.description");

  return rows;
}
