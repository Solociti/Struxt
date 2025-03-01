/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("id_counters", (table) => {
    table.increments("id").primary();

    table.string("name").notNullable().unique();
    table.integer("value").notNullable().defaultTo(0);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("id_counters");
}
