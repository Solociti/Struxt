// @ts-check
import { readFile, writeFile } from "node:fs/promises";

/**
 * Reads a JSON file and returns the contents as an object.
 *
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<Object>} - The contents of the JSON file.
 */
export async function readJsonFile(filePath) {
  const contents = await readFile(filePath, "utf-8");
  return JSON.parse(contents);
}

/**
 * Writes an object to a JSON file.
 *
 * @param {string} filePath
 * @param {object} data
 */
export async function writeJsonFile(filePath, data) {
  const contents = JSON.stringify(data, null, 2);
  await writeFile(filePath, contents + "\n", "utf-8");
}
