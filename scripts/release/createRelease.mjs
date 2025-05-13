// @ts-check
import chalk from "chalk";
import { execSync } from "node:child_process";
import prompts from "prompts";
import simpleGit from "simple-git";
import { readJsonFile, writeJsonFile } from "../jsonUtils.mjs";
import { incrementVersion } from "./utils.mjs";

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
      chalk.yellow("Creating pre-release from branch:", currentBranch.current)
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
    chalk.blue(newVersion)
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

  const releaseCommand = `gh release create ${tagName} --title "${title}" --generate-notes --target ${
    currentBranch.current
  } ${releaseType === "pre" ? "--prerelease" : ""}`;

  execSync(releaseCommand, {
    stdio: "inherit",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
