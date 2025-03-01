// @ts-check
import { readFile, writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import * as path from "node:path";
import prompts from "prompts";

async function main() {
  let contents = await readFile(".env", "utf8");
  const original = contents;

  // setup the default values
  if (!contents.includes("PRIMARY_DB")) {
    contents += [
      "",
      "# Setup the primary database",
      "PRIMARY_DB=struxt_app",
    ].join("\n");
  }

  if (!contents.includes("MARIADB_ROOT_PASSWORD")) {
    contents += [
      "",
      "# Setup the root password",
      "MARIADB_ROOT_PASSWORD=pass",
      "",
    ].join("\n");
  }

  // UPLOAD_DIR, SITE_STORAGE_DIR
  if (!contents.includes("UPLOAD_DIR")) {
    contents += [
      "",
      "# Setup the upload directory",
      `UPLOAD_DIR=${path.resolve(path.join(__dirname, "uploads"))}`,
      `SITE_STORAGE_DIR=${path.resolve(
        path.join(__dirname, "uploads/site_storage")
      )}`,
      "",
    ].join("\n");
  }

  if (!contents.includes("SMTP_HOST")) {
    contents += [
      "",
      "# Setup the SMTP server details",
      "SMTP_HOST=mail.solociti.com",
      "SMTP_PORT=587",
      "SMTP_FROM=email-from",
      "SMTP_USER=user",
      "SMTP_PASS=pass",
      "",
    ].join("\n");
  }

  if (contents !== original) {
    // allow the value to be edited
    const lines = contents.split("\n");

    const choices = lines
      .map((line, index) => ({ title: line, value: index }))
      .filter((line) => line.title && !line.title.startsWith("#"));

    choices.sort((a, b) => {
      return a.title.localeCompare(b.title);
    });

    const edit = await prompts({
      type: "multiselect",
      name: "values",
      message: "Which values do you want to edit?",
      choices,
    });

    for (const i of edit.values) {
      const line = lines[i];

      if (line.startsWith("#")) {
        continue;
      }
      if (!line) {
        continue;
      }

      const [key, value] = line.split("=");
      const prompt = `${key} (${value}): `;

      const response = await prompts({
        type: "text",
        name: "value",
        message: prompt,
        initial: value,
      });

      if (response.value && response.value !== value) {
        lines[i] = `${key}=${response.value}`;
      }
    }

    // add a new line at the end
    if (lines[lines.length - 1]) {
      lines.push("");
    }

    // write the changes to disk
    await writeFile(".env", lines.join("\n"));
  }
}

main();
