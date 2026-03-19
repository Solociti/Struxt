import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
const outputDir = join(projectRoot, "wasm-bins");

const treeSitterBuildTargets = [
  {
    packageName: "tree-sitter-javascript",
  },
];

const staticWasmCopyTargets = [
  {
    packageName: "web-tree-sitter",
    sourceFileName: "web-tree-sitter.wasm",
    outputFileName: "tree-sitter.wasm",
  },
];

/**
 * Resolves a file path under node_modules for the provided package.
 *
 * @param {string} packageName
 * @param {...string} segments
 * @returns {string}
 */
function getNodeModulePath(packageName, ...segments) {
  return join(projectRoot, "node_modules", packageName, ...segments);
}

/**
 * Throws when a required path does not exist.
 *
 * @param {string} targetPath
 * @param {string} message
 */
function ensurePathExists(targetPath, message) {
  if (!existsSync(targetPath)) {
    throw new Error(message);
  }
}

/**
 * Returns existing wasm files in a directory, sorted by most recent first.
 *
 * @param {string} dir
 * @returns {string[]}
 */
function getWasmFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter((name) => name.endsWith(".wasm"))
    .map((name) => join(dir, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
}

/**
 * Copies all wasm files from sourceDir into wasm-bins.
 * @param {string} sourceDir
 */
function copyAllWasmFromDirectory(sourceDir) {
  const wasmFiles = getWasmFiles(sourceDir);

  for (const wasmFilePath of wasmFiles) {
    const destinationPath = join(outputDir, basename(wasmFilePath));
    copyFileSync(wasmFilePath, destinationPath);
  }
}

/**
 * Get's the prebuilt .wasm files for a tree-sitter language package
 *
 * @param {{ packageName: string; }} target
 */
function getTreeSitterTargets(target) {
  const packageDir = getNodeModulePath(target.packageName);

  ensurePathExists(
    packageDir,
    `${target.packageName} is not installed. Run npm install first.`,
  );

  const wasmFiles = getWasmFiles(packageDir);
  if (wasmFiles.length === 0) {
    // In some cases, the wasm files may not be pre-built.
    // In that case, we may need to add tree-sitter-cli to build them locally.
    throw new Error(`No wasm files were found for ${target.packageName}.`);
  }

  copyAllWasmFromDirectory(packageDir);
}

/**
 * Copies a static wasm file from a package into the output directory.
 * @param {{ packageName: string; sourceFileName: string; outputFileName: string; }} target
 */
function copyStaticWasmTarget(target) {
  const sourcePath = getNodeModulePath(
    target.packageName,
    target.sourceFileName,
  );

  ensurePathExists(
    sourcePath,
    `${target.packageName}/${target.sourceFileName} is missing. Run npm install first.`,
  );

  const destinationPath = join(outputDir, target.outputFileName);
  copyFileSync(sourcePath, destinationPath);
}

/**
 * Builds and stages all configured wasm assets.
 */
function buildTreeSitterWasm() {
  mkdirSync(outputDir, { recursive: true });

  for (const target of treeSitterBuildTargets) {
    getTreeSitterTargets(target);
  }

  for (const target of staticWasmCopyTargets) {
    copyStaticWasmTarget(target);
  }

  console.log(`Tree-sitter wasm assets are ready in ${outputDir}.`);
}

buildTreeSitterWasm();
