/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("public_site_stats", (table) => {
    table.increments("id").primary();

    table.integer("site_id").unsigned().notNullable().defaultTo(0);

    table.string("method").notNullable().defaultTo("");
    table.string("hostname").notNullable().defaultTo("");
    table.string("url").notNullable().defaultTo("");
    table.string("path").notNullable().defaultTo("");

    table.string("ip").notNullable().defaultTo("");
    table.string("user_agent").notNullable().defaultTo("");

    table.string("referrer").notNullable().defaultTo("");

    table.integer("status", 3).notNullable().defaultTo(0);
    table.integer("response_time_ms", 15).notNullable().defaultTo(0);

    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("public_site_stats");
}
