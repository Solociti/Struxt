/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  console.log("Starting user ID migration");

  // modify the users table
  await knex.schema
    .alterTable("users", (table) => {
      table.string("uuid", 36).unique().after("id").comment("Keycloak UUID");

      table.dropColumn("password");
      table.dropColumn("role");
    })
    .alterTable("users_history", (table) => {
      table.string("uuid", 36).after("id").comment("Keycloak UUID");

      table.dropColumn("password");
      table.dropColumn("role");
    });

  // --------------------------------------------------------

  await knex.schema.dropTableIfExists("site_users");

  // --------------------------------------------------------
  // domains
  await knex.schema.alterTable("domains", (table) => {
    table.boolean("migration_marker").after("updated_by").defaultTo(false);
    table.dropForeign("updated_by");
    table.dropColumn("updated_by");
  });

  // domains_history
  await knex.schema.alterTable("domains_history", (table) => {
    table.boolean("migration_marker").after("updated_by").defaultTo(false);
    table.dropColumn("updated_by");
  });

  // site_assets
  await knex.schema.alterTable("site_assets", (table) => {
    table.boolean("migration_marker").after("updated_by").defaultTo(false);
    table.dropForeign("updated_by");
    table.dropColumn("updated_by");
  });

  // site_assets_history
  await knex.schema.alterTable("site_assets_history", (table) => {
    table.boolean("migration_marker").after("updated_by").defaultTo(false);
    table.dropColumn("updated_by");
  });

  // sites
  await knex.schema.alterTable("sites", (table) => {
    table.boolean("migration_marker").after("updated_by").defaultTo(false);
    table.dropForeign("updated_by");
    table.dropColumn("updated_by");
  });

  // sites_history
  await knex.schema.alterTable("sites_history", (table) => {
    table.boolean("migration_marker").after("updated_by").defaultTo(false);
    table.dropColumn("updated_by");
  });

  // user_roles
  await knex.schema.alterTable("user_roles", (table) => {
    table.boolean("migration_marker").after("updated_by").defaultTo(false);
    table.dropForeign("updated_by");
    table.dropForeign("user_id");
    table.dropUnique(["user_id", "site_id", "action"]);
    table.dropColumn("updated_by");
    table.dropColumn("user_id");
  });

  // user_roles_history
  await knex.schema.alterTable("user_roles_history", (table) => {
    table.boolean("migration_marker").after("updated_by").defaultTo(false);
    table.dropColumn("updated_by");
    table.dropColumn("user_id");
  });

  // --------------------------------------------------------
  // add the new columns
  // domains
  await knex.schema.alterTable("domains", (table) => {
    table
      .string("updated_by", 36)
      .after("migration_marker")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.dropColumn("migration_marker");
  });

  // domains_history
  await knex.schema.alterTable("domains_history", (table) => {
    table
      .string("updated_by", 36)
      .after("migration_marker")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.dropColumn("migration_marker");
  });

  // site_assets
  await knex.schema.alterTable("site_assets", (table) => {
    table
      .string("updated_by", 36)
      .after("migration_marker")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.dropColumn("migration_marker");
  });

  // site_assets_history
  await knex.schema.alterTable("site_assets_history", (table) => {
    table
      .string("updated_by", 36)
      .after("migration_marker")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.dropColumn("migration_marker");
  });

  // sites
  await knex.schema.alterTable("sites", (table) => {
    table
      .string("updated_by", 36)
      .after("migration_marker")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.dropColumn("migration_marker");
  });

  // sites_history
  await knex.schema.alterTable("sites_history", (table) => {
    table
      .string("updated_by", 36)
      .after("migration_marker")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.dropColumn("migration_marker");
  });

  // user_roles - needs both updated_by and user_id
  await knex.schema.alterTable("user_roles", (table) => {
    table
      .string("updated_by", 36)
      .after("migration_marker")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table
      .string("user_id", 36)
      .after("updated_by")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.dropColumn("migration_marker");
  });

  // user_roles_history - needs both updated_by and user_id
  await knex.schema.alterTable("user_roles_history", (table) => {
    table
      .string("updated_by", 36)
      .after("migration_marker")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table
      .string("user_id", 36)
      .after("updated_by")
      .references("uuid")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table.dropColumn("migration_marker");
  });

  await knex.schema.alterTable("user_roles", (table) => {
    table.unique(["user_id", "site_id", "action"]);
  });

  console.log("User ID migration complete");
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {}
