// @ts-check
import fs from "fs";

const copyProps = [
  "dependencies",
  "devDependencies",
  "name",
  "private",
  "type",
];

const puppeteerPackages = ["puppeteer"];

const readPackageJson = () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  return JSON.parse(packageJson);
};

const writePackageJson = (name, packageJson) => {
  fs.writeFileSync(name, JSON.stringify(packageJson, null, 2));
};

/**
 * Simplify package.json for Docker image
 *
 * Prevents unnecessary packages from being installed in the Docker image
 * and prevents the docker cached layers from being invalidated when version changes.
 */
function main() {
  const originalPack = readPackageJson();

  const dockerPack = {};
  for (const prop of copyProps) {
    dockerPack[prop] = originalPack[prop];
  }

  const puppeteerPack = JSON.parse(JSON.stringify(dockerPack));
  puppeteerPack.devDependencies = {};

  // Remove puppeteer packages from the main package.json
  // and move them to the required dependencies in the puppeteer package.json
  for (const pack of puppeteerPackages) {
    if (dockerPack.dependencies[pack]) {
      delete dockerPack.dependencies[pack];
    }

    if (dockerPack.devDependencies[pack]) {
      puppeteerPack.dependencies[pack] = originalPack.devDependencies[pack];
      delete dockerPack.devDependencies[pack];
    }
  }

  writePackageJson("docker-package.json", dockerPack);
  writePackageJson("puppeteer-package.json", puppeteerPack);
}
main();
