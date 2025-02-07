/**
 *
 * @param {import('knex').Knex} knex
 * @returns
 */
export async function up(knex) {
  return knex.schema
    .createTable("users", (table) => {
      table.increments("id").primary();

      table.string("email").notNullable().unique();
      table.string("display_name").notNullable();

      table.string("password").notNullable();

      table.string("role").notNullable().defaultTo("user");

      table.timestamps(true, true);
    })
    .createTable("users_history", (table) => {
      table.increments("__id").primary();

      table.integer("id").unsigned().notNullable();

      table.string("email").notNullable();
      table.string("display_name").notNullable();
      table.string("password").notNullable();
      table.string("role").notNullable();

      table.timestamps(true, true);
    })
    .createTable("sites", (table) => {
      table.increments("id").primary();

      table.string("name").notNullable();
      table.string("description").notNullable();

      table
        .integer("updated_by")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users");

      table
        .json("project")
        .notNullable()
        .defaultTo("{}")
        .comment("GrapesJS project");

      table.timestamps(true, true);
    })
    .createTable("sites_history", (table) => {
      table.increments("__id").primary();

      table.integer("id").unsigned().notNullable();

      table.string("name").notNullable();
      table.string("description").notNullable();

      table.integer("updated_by").unsigned().notNullable();

      table.json("project").notNullable().defaultTo("{}");

      table.timestamps(true, true);
    })
    .createTable("user_roles", (table) => {
      table.increments("id").primary();

      table.integer("user_id").unsigned().references("id").inTable("users");
      table.integer("site_id").unsigned().references("id").inTable("sites");
      table.string("action").notNullable().defaultTo("view");
      table.unique(["user_id", "site_id", "action"]);

      table.integer("enabled", 1).notNullable().defaultTo(0);
      table.integer("updated_by").unsigned().references("id").inTable("users");

      table.timestamps(true, true);
    })
    .createTable("user_roles_history", (table) => {
      table.increments("__id").primary();

      table.integer("id").unsigned().notNullable();

      table.integer("user_id").unsigned();
      table.integer("site_id").unsigned();
      table.string("action").notNullable().defaultTo("view");

      table.integer("enabled", 1).notNullable().defaultTo(0);
      table.integer("updated_by").unsigned();

      table.timestamps(true, true);
    })
    .createTable("domains", (table) => {
      table.increments("id").primary();

      table
        .integer("site_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("sites");
      table
        .integer("updated_by")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users");

      table.string("domain").notNullable().unique();

      table.integer("enabled", 1).notNullable().defaultTo(1);
      table.integer("is_primary", 1).notNullable().defaultTo(0);

      table.integer("ssl", 1).notNullable().defaultTo(1);
      table.string("ssl_email").notNullable().defaultTo("");

      table.timestamps(true, true);
    })
    .createTable("domains_history", (table) => {
      table.increments("__id").primary();

      table.integer("id").unsigned().notNullable();

      table.integer("site_id").unsigned().notNullable();
      table.integer("updated_by").unsigned().notNullable();

      table.string("domain").notNullable().unique();

      table.integer("enabled", 1).notNullable().defaultTo(1);
      table.integer("is_primary", 1).notNullable().defaultTo(0);

      table.integer("ssl", 1).notNullable().defaultTo(1);
      table.string("ssl_email").notNullable().defaultTo("");

      table.timestamps(true, true);
    })
    .createTable("site_users", (table) => {
      table
        .integer("site_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("sites")
        .onDelete("CASCADE");

      table
        .integer("user_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");

      table.primary(["site_id", "user_id"]);
    })
    .createTable("site_assets", (table) => {
      table.increments("id").primary();

      table.string("file_path").notNullable().unique();
      table.string("original_name").notNullable().defaultTo("");

      table
        .integer("site_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("sites")
        .onDelete("CASCADE");
      table
        .integer("updated_by")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("RESTRICT");

      table.timestamps(true, true);
    })
    .createTable("site_assets_history", (table) => {
      table.increments("__id").primary();

      table.integer("id").unsigned().notNullable();

      table.string("file_path").notNullable().unique();
      table.string("original_name").notNullable().defaultTo("");

      table.integer("site_id").unsigned().notNullable();
      table.integer("updated_by").unsigned().notNullable();

      table.timestamps(true, true);
    });
}

/**
 *
 * @param {import('knex').Knex} knex
 * @returns
 */
export async function down(knex) {
  return (
    knex.schema
      // drop all foreign keys
      .alterTable("user_roles", (table) => {
        table.dropForeign("user_id");
        table.dropForeign("site_id");
        table.dropForeign("updated_by");
      })
      .alterTable("sites", (table) => {
        table.dropForeign("updated_by");
      })
      .alterTable("domains", (table) => {
        table.dropForeign("site_id");
        table.dropForeign("updated_by");
      })
      .alterTable("site_users", (table) => {
        table.dropForeign("site_id");
        table.dropForeign("user_id");
      })
      .alterTable("site_assets", (table) => {
        table.dropForeign("site_id");
        table.dropForeign("updated_by");
      })
      // drop all tables
      .dropTable("domains")
      .dropTable("domains_history")
      .dropTable("site_users")
      .dropTable("site_assets")
      .dropTable("site_assets_history")
      .dropTable("user_roles")
      .dropTable("user_roles_history")
      .dropTable("sites")
      .dropTable("sites_history")
      .dropTable("users")
      .dropTable("users_history")
  );
}
