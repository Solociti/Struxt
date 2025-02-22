import knexDb from "knex";
import config from "../../knexfile.js";

/**
 * Tells if the db init has run.
 */
let isInitialized = false;

export const knex = knexDb(config);

/**
 * Get the table for knex
 *
 * @param name
 * @returns
 */
export function getTable(name: string) {
  return knex.table(name);
}

/**
 * Migrate the database to the latest version
 */
export async function dbInit() {
  if (isInitialized) {
    return;
  }
  console.log("Migrating database...");

  await knex.migrate.latest();
  isInitialized = true;
}
