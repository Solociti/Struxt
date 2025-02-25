/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    .createTable("pub_form_settings", (table) => {
      table.increments("id").primary();

      table.integer("site_id").unsigned().references("id").inTable("sites");
      table.string("site_env", 15).notNullable().defaultTo("production");
      table.string("form_name", 50).notNullable();

      table.unique(["site_id", "site_env", "form_name"]);

      table
        .binary("enabled", 1)
        .notNullable()
        .defaultTo(1)
        .comment("When false, will not accept submissions");

      table
        .binary("send_email", 1)
        .notNullable()
        .defaultTo(1)
        .comment("When true, will send an email to the admin");
      table
        .string("email_to")
        .notNullable()
        .defaultTo("")
        .comment(
          "The comma separated list of emails to send the form submission to."
        );

      table
        .string("email_subject")
        .notNullable()
        .defaultTo("")
        .comment("The subject of the email.");

      table.timestamps(true, true);
    })
    .createTable("pub_form_validation", (table) => {
      table.increments("id").primary();

      table.integer("site_id").unsigned().references("id").inTable("sites");
      table.string("site_env", 15).notNullable().defaultTo("production");
      table.string("form_name", 50).notNullable();
      table.string("field_name").notNullable();

      table.unique(["site_id", "site_env", "form_name", "field_name"]);

      table.string("type").notNullable();

      table.boolean("required").notNullable().defaultTo(false);
      table.boolean("archived").notNullable().defaultTo(false);

      table.timestamps(true, true);
    })
    .createTable("pub_form_submissions", (table) => {
      table.increments("id").primary();

      table.integer("site_id").unsigned().references("id").inTable("sites");
      table.string("site_env", 15).notNullable().defaultTo("production");
      table.string("form_name", 50).notNullable();

      table.json("contents").notNullable();

      table.string("ip_address").notNullable().defaultTo("");
      table.string("user_agent").notNullable().defaultTo("");

      table
        .string("sent_email_id")
        .notNullable()
        .defaultTo("")
        .comment("The email id of the email that was sent to the admin");

      table.timestamps(true, true);
    })
    .createTable("pub_form_attachments", (table) => {
      table.increments("id").primary();

      table
        .integer("submission_id")
        .unsigned()
        .references("id")
        .inTable("pub_form_submissions");

      table.string("file_name").notNullable();
      table.string("original_name").notNullable();

      table.string("av_status").notNullable().defaultTo("pending");
      table.string("av_result").notNullable().defaultTo("");

      table.timestamps(true, true);
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTable("pub_form_attachments")
    .dropTable("pub_form_submissions")
    .dropTable("pub_form_settings")
    .dropTable("pub_form_validation");
}
