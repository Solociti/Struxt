// @ts-check
import chalk from "chalk";
import { execSync } from "node:child_process";
import prompts from "prompts";
import simpleGit from "simple-git";
import { readJsonFile, writeJsonFile } from "../jsonUtils.mjs";
import { incrementVersion } from "./utils.mjs";
import { readFile } from "node:fs/promises";
import { load as loadYaml } from "js-yaml";

/**
 * Creates a new release for the project.
 */
async function main() {
  const baseDir = process.cwd();

  const git = simpleGit(baseDir);

  const currentBranch = await git.branch();
  const isMainBranch = currentBranch.current === "main";
  const isStagingBranch = currentBranch.current === "staging";

  // choose the release type. Any branch other than main or staging will be a pre-release
  /**
   * @type {"major" | "minor" | "patch" | "pre"}
   */
  let releaseType = "patch";

  if (!isMainBranch && !isStagingBranch) {
    console.log(
      chalk.yellow("Creating pre-release from branch:", currentBranch.current),
    );
    releaseType = "pre";
  } else {
    const response = await prompts({
      type: "select",
      name: "releaseType",
      message: "Choose release type.",
      choices: [
        { title: "Major", value: "major" },
        { title: "Minor", value: "minor" },
        { title: "Patch", value: "patch", selected: true },
        { title: "Pre-release", value: "pre" },
      ],
    });

    releaseType = response.releaseType;
  }

  // get the current version
  const packageJson = await readJsonFile("package.json");

  const currentVersion = packageJson.version;
  const newVersion = incrementVersion(currentVersion, releaseType);

  console.log(
    chalk.green("Creating release:"),
    chalk.blue(currentVersion),
    "->",
    chalk.blue(newVersion),
  );

  // update the version in package.json
  packageJson.version = newVersion;
  await writeJsonFile("package.json", packageJson);

  const packageLockJson = await readJsonFile("package-lock.json");
  packageLockJson.version = newVersion;
  packageLockJson.packages[""].version = newVersion;
  await writeJsonFile("package-lock.json", packageLockJson);

  // commit the changes
  await git.add("package.json");
  await git.add("package-lock.json");

  const commitMessage = `Release: ${newVersion}`;
  await git.commit(commitMessage);
  console.log(chalk.green("Committed changes:"), commitMessage);

  // push the changes
  await git.push("origin", currentBranch.current);

  // run the gh release command
  const tagName = `v${newVersion}`;
  const date = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const titleResult = await prompts({
    type: "text",
    name: "title",
    message: "Enter the release title.",
    initial: ``,
  });

  const title = `${titleResult.title} | ${date} | ${newVersion}`;

  const releaseCommand = `gh release create ${tagName} --title "${title}" --generate-notes --draft --target ${
    currentBranch.current
  } ${releaseType === "pre" ? "--prerelease" : ""}`;

  // execSync(releaseCommand, {
  //   stdio: "inherit",
  // });

  // watch the status of the build
  const workflowName = await getWorkflowName();
  const workflowListCommand = `gh run list -w "${workflowName}" --json databaseId,name,status,workflowName`;
  const workflowResult = execSync(workflowListCommand, { encoding: "utf-8" });

  try {
    /**
     * @type {{databaseId: number, name: string, status: string, workflowName: string}[]}
     */
    const workflowList = JSON.parse(workflowResult);
    const workflow = workflowList.find((w) => w.status !== "completed" || true);

    if (!workflow) {
      console.log(chalk.red("Workflow not found"));
      return;
    }

    const infoCommand = `gh run view ${workflow.databaseId} --json jobs,displayTitle,conclusion,status`;

    const check = chalk.green("✔");
    const fail = chalk.red("✖");
    const waiting = chalk.gray("…");
    const inProgress = chalk.cyan("…");

    /**
     *
     * @param {string} status
     * @returns
     */
    const showStatus = (status) => {
      if (status === "completed") {
        return check;
      }
      if (status === "failure") {
        return fail;
      }
      if (status === "in_progress") {
        return inProgress;
      }
      return waiting;
    };

    const exec = () => {
      const infoContent = execSync(infoCommand, { encoding: "utf-8" });

      /**
       * @typedef GhInfo
       * @property {string} status
       * @property {string} conclusion
       * @property {string} displayTitle
       * @property {GhJob[]} jobs
       */

      /**
       * @typedef GhJob
       * @property {string} completedAt
       * @property {string} conclusion
       * @property {number} databaseId
       * @property {string} name
       * @property {string} startedAt
       * @property {string} status
       * @property {GhStep[]} steps
       */

      /**
       * @typedef GhStep
       * @property {string} conclusion
       * @property {string} name
       * @property {number} number
       * @property {string} status
       */

      /**
       * @type {GhInfo}
       */
      const info = JSON.parse(infoContent);

      console.log(showStatus(info.status), chalk.gray(info.displayTitle));

      for (const job of info.jobs) {
        console.log(
          "  ",
          showStatus(job.status),
          chalk.gray(job.name),
          chalk.blue(job.status),
        );

        for (const step of job.steps) {
          console.log(
            "    ",
            showStatus(step.status),
            chalk.gray(step.name),
            chalk.blue(step.status),
          );
        }
      }

      return info.status === "completed" || info.status === "failure";
    };

    while (!exec()) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error(err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 *
 * @returns
 */
async function getWorkflowConfig() {
  const file = "./.github/workflows/docker-build.yml";

  const contents = await readFile(file, { encoding: "utf-8" });

  const doc = /** @type {Record<string, any>} */ (loadYaml(contents));
  return doc;
}

async function getWorkflowName() {
  const config = await getWorkflowConfig();
  return config.name;
}
