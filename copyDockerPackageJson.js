// @ts-check
import fs from "fs";

const copyProps = [
  "dependencies",
  "devDependencies",
  "name",
  "private",
  "type",
];

const readPackageJson = () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  return JSON.parse(packageJson);
};

const writePackageJson = (packageJson) => {
  fs.writeFileSync("docker-package.json", JSON.stringify(packageJson, null, 2));
};

/**
 * Simplify package.json for Docker image
 *
 * Prevents unnecessary packages from being installed in the Docker image
 * and prevents the docker cached layers from being invalidated when version changes.
 */
function main() {
  const packageJson = readPackageJson();

  const newPackageJson = {};
  for (const prop of copyProps) {
    newPackageJson[prop] = packageJson[prop];
  }

  writePackageJson(newPackageJson);
}
main();
