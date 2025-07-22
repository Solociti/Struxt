/**
 * Look up the current target Node.js version in the primary build.Dockerfile
 * and check that the current Node.js version matches.
 *
 * If the versions do not match,
 * if it's a minor version mismatch, log a warning.
 * if it's multiple minor versions mismatch, log an error.
 * if it's a major version mismatch, throw an error.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const dockerfilePath = join(__dirname, "..", "build.Dockerfile");

async function checkNodeVersion() {
  const {
    major: dockerMajor,
    minor: dockerMinor,
    patch: dockerPatch,
  } = await getDockerNodeVersion();
  const dockerVersion = [dockerMajor, dockerMinor, dockerPatch]
    .filter(Boolean)
    .join(".");

  const currentVersion = process.versions.node.split(".").map(Number);
  const [major, minor, patch] = currentVersion;

  function logMessage(type, message) {
    message =
      type === "error"
        ? chalk.red(message)
        : type === "warn"
        ? chalk.yellow(message)
        : chalk.grey(message);

    const msg = [
      chalk.grey("----------"),
      chalk.bold.blue("Node.js Version Check"),
      chalk.bold.green(`Current: ${process.versions.node}`),
      chalk.bold.blue(`Required: ${dockerVersion}`),
      "",
      message,
      chalk.grey(
        `  nvm install --reinstall-packages-from=default ${dockerMajor} && nvm use ${dockerMajor} && nvm alias default ${dockerMajor}`
      ),
      chalk.grey("----------"),
    ].join("\n");

    if (type === "error") {
      console.error(msg);
    } else if (type === "warn") {
      console.warn(msg);
    } else {
      console.log(msg);
    }
  }

  if (dockerMajor !== major) {
    logMessage("error", `Major version mismatch.`);
    return 1;
  }

  if (dockerMinor && dockerMinor !== minor) {
    const diff = Math.abs(dockerMinor - minor);
    if (diff === 1) {
      logMessage("warn", `Minor version mismatch.`);
      return 0;
    } else {
      logMessage("error", `Minor versions mismatch.`);
      return 0;
    }
  }

  if (dockerPatch && dockerPatch !== patch) {
    logMessage("warn", `Patch version mismatch.`);
    return 0;
  }

  return 0;
}

async function getDockerNodeVersion() {
  try {
    const dockerfileContent = await readFile(dockerfilePath, "utf-8");
    const versionMatch = dockerfileContent.match(/FROM\snode:([\d\.]{0,})/);
    if (!versionMatch) {
      throw new Error("Node version not found in Dockerfile");
    }
    const [major, minor, patch] = versionMatch[1].split(".").map(Number);

    return {
      major,
      minor,
      patch,
    };
  } catch (error) {
    console.error("Error reading Dockerfile:", error);
    throw error;
  }
}

checkNodeVersion()
  .then((code) => {
    process.exit(code || 0);
  })
  .catch((error) => {
    console.error("Node version check failed:", error);
    process.exit(1);
  });
