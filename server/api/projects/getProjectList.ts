import { knex } from "../../utils/database.ts";

export async function getProjectsForUser(userId: string) {
  const rows = await knex.table("sites").select("id", "name", "description");

  return rows;
}
