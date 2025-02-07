import knexDb from "knex";
import config from "../../knexfile.js";

export const knex = knexDb(config);

export function getTable(name: string) {
  return knex.table(name);
}
