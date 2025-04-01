// @ts-check

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    .createTable("site_publish_info", (table) => {
      table.increments("id").primary();

      table.integer("site_id").unsigned().notNullable().defaultTo(0);

      table
        .string("site_env")
        .notNullable()
        .defaultTo("")
        .comment("The site environment published to.");

      table
        .string("screenshot_url")
        .notNullable()
        .defaultTo("")
        .comment("The URL of the screenshot of the site.");

      table
        .dateTime("published_at")
        .notNullable()
        .defaultTo(knex.fn.now())
        .comment("The date and time the site was published.");
      table.string("published_by", 36).references("uuid").inTable("users");

      // create a search index
      table.index(["site_id", "site_env", "published_at"], "lookup_info");
    })
    .alterTable("domains", (table) => {
      table.string("site_env").notNullable().defaultTo("").after("domain");
    })
    .alterTable("domains_history", (table) => {
      table.string("site_env").notNullable().defaultTo("").after("domain");
    })
    .alterTable("pub_form_settings", (table) => {
      table
        .boolean("enabled")
        .notNullable()
        .defaultTo(true)
        .comment("When false, will not accept submissions")
        .alter();

      table
        .boolean("send_email")
        .notNullable()
        .defaultTo(false)
        .comment("When true, will send an email to the admin")
        .alter();
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTable("site_publish_info")
    .alterTable("domains", (table) => {
      table.dropColumn("site_env");
    })
    .alterTable("domains_history", (table) => {
      table.dropColumn("site_env");
    });
}
