import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const mkdir = promisify(fs.mkdir);

/**
 * Recursively create a directory
 *
 * @param dir
 * @returns
 */
export async function mkDirRecursive(dir: string) {
  const exists = fs.existsSync(dir);
  if (exists) {
    return;
  }

  await mkdir(dir, { recursive: true });
}
