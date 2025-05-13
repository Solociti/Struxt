// @ts-check
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import prompts from "prompts";
import { readJsonFile } from "./scripts/jsonUtils.mjs";

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

  if (!contents.includes("RL_LEAK_RATE")) {
    contents += [
      "",
      "# Leaky bucket rate limiting values",
      "# leak rate is the number of tokens added per window time",
      "RL_LEAK_RATE=1200",
      "RL_WINDOW_SECONDS=600",
      "RL_MAX_TOKENS=200",
    ].join("\n");
  }

  if (!contents.includes("KEYCLOAK_DB_PASSWORD")) {
    contents += [
      "",
      "# Setup the keycloak variables",
      "KEYCLOAK_DB_PASSWORD=set-password",
      "KEYCLOAK_HOSTNAME=accounts.solociti.com",
      "KEYCLOAK_ADMIN_HOSTNAME=localhost:8080",
    ].join("\n");
  }

  if (!contents.includes("KEYCLOAK_REALM")) {
    contents += ["KEYCLOAK_REALM=Solociti"].join("\n");
  }

  if (!contents.includes("KEYCLOAK_CLIENT_ID")) {
    contents += [
      "",
      "KEYCLOAK_CLIENT_ID=struxt",
      "KEYCLOAK_CLIENT_SECRET=secret",
    ].join("\n");
  }

  if (!contents.includes("PASSPORT_SESSION_SECRET")) {
    // use the crypto module to generate a random key
    const randomKey = randomBytes(32).toString("hex");

    contents += [
      "",
      "# Passport session secret",
      `PASSPORT_SESSION_SECRET=${randomKey}`,
    ].join("\n");
  }

  if (!contents.includes("AUTH_VALID_HOSTS")) {
    contents += [
      "",
      "# Auth valid hosts",
      "AUTH_VALID_HOSTS=struxt.solociti.com",
    ].join("\n");
  }

  if (!contents.includes("MONGODB_URI")) {
    contents += [
      "",
      "# MongoDB Connection information",
      "MONGODB_URI=mongodb://localhost:27017/",
      "MONGODB_PREFIX=struxt",
      "MONGODB_USERNAME=struxt",
      "MONGODB_PASSWORD=" +
        randomBytes(20).toString("base64").replace(/[^\w]/g, ""),
    ].join("\n");
  }

  if (!contents.includes("MAXMIND_LICENSE_KEY")) {
    contents += ["", "# Maxmind license key", "MAXMIND_LICENSE_KEY="].join(
      "\n"
    );
  }

  if (!contents.includes("NGINX_PROXY_MANAGER_USER")) {
    contents += [
      "",
      "# Nginx Proxy Manager user",
      "NGINX_PROXY_MANAGER_USER=bot@struxt.solociti.com",
      `NGINX_PROXY_MANAGER_PASS="${randomBytes(24).toString("base64")}"`,
    ].join("\n");
  }

  if (!contents.includes("LETSENCRYPT_EMAIL")) {
    contents += [
      "",
      "# Lets Encrypt email (set license to accept)",
      "# This is required for the Nginx Proxy Manager to work",
      "LETSENCRYPT_LICENSE=deny",
      "LETSENCRYPT_EMAIL=",
    ].join("\n");
  }

  if (contents !== original) {
    // allow the value to be edited
    const lines = contents.split("\n");

    const choices = lines
      .map((line, index) => ({ title: line, value: index }))
      .filter(
        (line) =>
          line.title &&
          !line.title.startsWith("#") &&
          !line.title.startsWith("VERSION=")
      );

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
        if (response.value.includes(",")) {
          lines[i] = `${key}="${response.value}"`;
        } else {
          lines[i] = `${key}=${response.value}`;
        }
      }
    }

    contents = lines.join("\n");
  }

  // remove the version line
  contents = contents.replace(/VERSION=.+$/gm, "").trim();
  // add the current version
  const packageJson = await readJsonFile("package.json");
  const version = packageJson.version || "latest";
  contents = [`VERSION=${version}`, "", contents, ""].join("\n");

  // write the changes to disk
  await writeFile(".env", contents, { encoding: "utf8" });
}

main();
