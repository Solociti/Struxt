// @ts-check
import chalk from "chalk";
import { parse } from "dotenv";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import prompts from "prompts";
import { readJsonFile } from "./scripts/jsonUtils.mjs";
import { exec } from "node:child_process";

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  let contents = await readFile(".env", "utf8");
  const original = contents;
  const parsed = parse(original);

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

  if (!contents.includes("STRUXT_DOMAIN")) {
    contents += [
      "",
      "# Primary struxt domain",
      "STRUXT_DOMAIN=struxt.solociti.com",
    ].join("\n");
  }

  if (!contents.includes("STRUXT_REGISTER_DOMAIN")) {
    contents += [
      "",
      "# Domain used to to register the free subdomains.",
      "STRUXT_REGISTER_DOMAIN=struxt.solociti.com",
      "# The proxy domain. Will use the proxy domain A records as recommended settings for root domains.",
      "# For subdomains, will recommend using a cname pointing to the proxy domain.",
      "STRUXT_PROXY_DOMAIN=proxy.struxt.solociti.com",
    ].join("\n");
  }

  if (!contents.includes("BACKUP_DIR")) {
    const startingHour = randomNumber(0, 11);
    const backupDir = parsed.SITE_STORAGE_DIR
      ? path.resolve(parsed.SITE_STORAGE_DIR, "../backups")
      : path.resolve(path.join(__dirname, "uploads/backups"));

    contents += [
      "",
      "# Directory used to store backups",
      `BACKUP_DIR=${backupDir}`,
      "BACKUP_ENABLED=true",
      `BACKUP_CRON=${randomNumber(0, 59)} ${startingHour},${
        startingHour + 12
      } * * *`,
      "BACKUP_KEEP_LOCAL_DAYS=1",
      "BACKUP_UPLOAD_TO_S3=false",
      "BACKUP_S3_ENDPOINT=",
      "BACKUP_S3_BUCKET=",
      "BACKUP_S3_PORT=443",
      "BACKUP_S3_USE_SSL=true",
      "BACKUP_S3_ACCESS_KEY=",
      "BACKUP_S3_SECRET_KEY=",
    ].join("\n");
  }

  const aiKeys = [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_GEN_AI_API_KEY",
  ];
  for (const key of aiKeys) {
    if (!contents.includes(key)) {
      contents += ["", `# ${key} is used for AI services`, `${key}=`].join(
        "\n"
      );
    }
  }

  if (!contents.includes("LANGCHAIN_TRACING_V2")) {
    contents += [
      "",
      "# Langchain Tracing settings",
      "LANGCHAIN_TRACING_V2=false",
      "LANGCHAIN_API_KEY=",
      "LANGCHAIN_PROJECT=struxt-ai-pilot",
      "LANGCHAIN_ENDPOINT=https://api.smith.langchain.com",
    ].join("\n");
  }

  if (!contents.includes("DOCKER_GROUP_ID")) {
    const result = await new Promise((resolve) => {
      exec("getent group docker", (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const parts = stdout.trim().split(":");
        if (parts.length < 3) {
          resolve(null);
          return;
        }

        const groupId = parts[2];
        resolve(groupId);
      });
    });

    contents += [
      "",
      "# The docker group is is used to run docker commands from the core container.",
      `DOCKER_GROUP_ID=${result || "999"}`,
    ].join("\n");
  }

  if (contents !== original) {
    // allow the value to be edited
    const lines = contents.split("\n");
    const originalKeys = Object.keys(parsed);

    const newLines = lines.filter((line) => {
      if (!line || line.startsWith("#")) {
        return false;
      }

      const [key, _value] = line.split("=");
      return !originalKeys.includes(key);
    });

    /**
     * @type {{ title: string; value: number }[]}
     */
    const choices = lines
      .map((line, index) => {
        if (!line || line.startsWith("#") || line.startsWith("VERSION=")) {
          return null;
        }

        const [key, value] = line.split("=");

        const title = [
          newLines.includes(line) ? chalk.green("(new) ") : "",
          chalk.bold(key),
          chalk.grey("="),
          chalk.grey(value || ""),
        ]
          .filter(Boolean)
          .join("");

        return {
          title,
          value: index,
        };
      })
      .filter((val) => val !== null);

    choices.sort((a, b) => {
      if (a.title.includes("(new)") && !b.title.includes("(new)")) {
        return -1;
      }
      if (b.title.includes("(new)") && !a.title.includes("(new)")) {
        return 1;
      }

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
  const version = packageJson.version ? `v${packageJson.version}` : "latest";
  contents = [`VERSION=${version}`, "", contents, ""].join("\n");

  // write the changes to disk
  await writeFile(".env", contents, { encoding: "utf8" });
}

main();
