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
 * @deprecated
 * @param name
 * @returns
 */
export function getTable(name: string) {
  return knex.table(name);
}

/**
 * Migrate the database to the latest version
 *
 * @deprecated
 */
export async function dbInit() {
  if (isInitialized) {
    return;
  }

  // check if mariadb is running
  while (true) {
    try {
      await knex.select(1);
      break;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  console.log("Migrating database...");

  await knex.migrate.latest();
  isInitialized = true;
}

process.on("SIGTERM", () => {
  knex.destroy();
});
