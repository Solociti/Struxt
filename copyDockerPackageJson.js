// @ts-check
import fs from "fs";

const readPackageJson = () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  return JSON.parse(packageJson);
};

const writePackageJson = (packageJson) => {
  fs.writeFileSync("docker-package.json", JSON.stringify(packageJson, null, 2));
};

function main() {
  const packageJson = readPackageJson();
  packageJson.type = "commonjs";
  writePackageJson(packageJson);
}
main();
