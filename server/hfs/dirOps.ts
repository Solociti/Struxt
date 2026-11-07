import { existsSync } from "node:fs";
import { readdir, rm, rmdir } from "node:fs/promises";
import { dirname } from "node:path";
import { isPathInside } from "./path";

/**
 * Clears all empty directories in the given directory.
 *
 * @param dir the directory to start traversing from
 * @param recursive if true, will traverse to parents recursively
 * @param rootDir will not clear directories outside of this root directory
 */
export async function rmDirIfEmpty(
  dir: string,
  recursive: boolean,
  rootDir: string,
): Promise<void> {
  if (!isPathInside(dir, rootDir)) {
    return;
  }

  // check if the directory exists
  if (!existsSync(dir)) {
    return;
  }

  const files = await readdir(dir);
  if (files.length === 0) {
    await rmdir(dir);

    if (recursive) {
      const parentDir = dirname(dir);
      await rmDirIfEmpty(parentDir, true, rootDir);
    }
  }
}

/**
 * Recursively removes a directory and its contents.
 *
 * @param dir
 * @param rootDir
 * @returns
 */
export async function rmDirRecursive(dir: string, rootDir: string) {
  if (!isPathInside(dir, rootDir)) {
    return;
  }

  if (!existsSync(dir)) {
    return;
  }

  await rm(dir, { recursive: true });
}
