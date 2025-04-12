/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema
    .alterTable("domains", (table) => {
      table.dropColumns("ssl", "ssl_email");

      table
        .boolean("dns_verified")
        .defaultTo(false)
        .notNullable()
        .comment(
          "Will be set to true when the dns settings have been correctly set."
        )
        .after("is_primary");
    })
    .alterTable("domains_history", (table) => {
      table.dropColumns("ssl", "ssl_email");

      table
        .boolean("dns_verified")
        .defaultTo(false)
        .notNullable()
        .comment(
          "Will be set to true when the dns settings have been correctly set."
        )
        .after("is_primary");
    })
    .createTable("project_settings", (table) => {
      table.increments("id").primary();
      table
        .integer("site_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("sites");

      table
        .string("site_env")
        .notNullable()
        .defaultTo("")
        .comment("The site environment published to.");

      table.unique(["site_id", "site_env"]);

      // Add the other settings columns
      table
        .boolean("force_ssl")
        .notNullable()
        .defaultTo(true)
        .comment("Force SSL");
      table
        .boolean("hsts")
        .notNullable()
        .defaultTo(true)
        .comment(
          "HTTP Strict Transport Security. (Has no effect if force_ssl is not set)"
        );

      // Add blame and dates
      table.string("updated_by").defaultTo(null).nullable();
      table.timestamps(true, true);
    })
    .createTable("project_settings_history", (table) => {
      table.increments("_id").primary();

      table
        .integer("site_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("sites");

      table
        .string("site_env")
        .notNullable()
        .defaultTo("")
        .comment("The site environment published to.");

      // Add the other settings columns
      table
        .boolean("force_ssl")
        .notNullable()
        .defaultTo(true)
        .comment("Force SSL");
      table
        .boolean("hsts")
        .notNullable()
        .defaultTo(true)
        .comment(
          "HTTP Strict Transport Security. (Has no effect if force_ssl is not set)"
        );

      // Add blame and dates
      table.string("updated_by").defaultTo(null).nullable();
      table.timestamps(true, true);
    });

  /**
   * @type {import("common/models/database").db_sites[]}
   */
  const rows = await knex.table("sites").select("*");

  for (const row of rows) {
    /**
     * @type {Partial<import("common/models/database").db_project_settings>}
     */
    const settings = {
      force_ssl: true,
      hsts: true,
    };

    for (const env of ["production", "staging"]) {
      await knex("project_settings")
        .insert({
          site_id: row.id,
          site_env: env,
          ...settings,
        })
        .onConflict()
        .ignore();
      await knex("project_settings_history").insert({
        site_id: row.id,
        site_env: env,
        ...settings,
      });
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .alterTable("domains", (table) => {
      table.dropColumn("dns_verified");

      table.boolean("ssl").defaultTo(false).notNullable().after("is_primary");
      table.string("ssl_email").defaultTo(null).nullable().after("ssl");
    })
    .alterTable("domains_history", (table) => {
      table.dropColumn("dns_verified");

      table.boolean("ssl").defaultTo(false).notNullable().after("is_primary");
      table.string("ssl_email").defaultTo(null).nullable().after("ssl");
    })
    .dropTable("project_settings")
    .dropTable("project_settings_history");
}
