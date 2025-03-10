import { knex } from "./database.ts";

export type IdCounterName = "submission";

async function counter(name: IdCounterName) {
  const [result] = await knex.raw(
    "INSERT INTO id_counters (name) VALUES (?) ON DUPLICATE KEY UPDATE value = id_counters.value + 1 RETURNING value",
    [name]
  );

  return result[0].value;
}

/**
 * Create a simple unique identifier
 *
 * @param name
 * @returns
 */
export async function createSimpleId(name: IdCounterName) {
  const count = await counter(name);

  const sections = [
    count.toString(36).padStart(4, "0"),
    Date.now().toString(36).padStart(8, "0"),
  ].join("-");

  return sections;
}
