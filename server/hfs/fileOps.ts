import { copyFile, rename, unlink } from "node:fs/promises";
import { isPathInside } from "./path";

interface FileOpsOptions {
  /**
   * When set, the file must be nested inside this directory
   */
  restrictedTo?: string;
}

/**
 * Deletes a file from
 *
 * @param path
 * @param param1
 */
export async function hfsUnlinkFile(
  path: string,
  { restrictedTo }: FileOpsOptions,
) {
  if (restrictedTo) {
    if (!isPathInside(path, restrictedTo)) {
      throw new Error("Could not delete the requested file.");
    }
  }

  await unlink(path);
}

/**
 * Renames/Moves a file from
 *
 * @param from
 * @param to
 * @param param2
 */
export async function hfsRenameFile(
  from: string,
  to: string,
  { restrictedTo }: FileOpsOptions,
) {
  if (restrictedTo) {
    if (!isPathInside(from, restrictedTo)) {
      throw new Error("Could not rename the requested file.");
    }
    if (!isPathInside(to, restrictedTo)) {
      throw new Error("Could not rename the requested file.");
    }
  }

  await rename(from, to);
}

/**
 * Copies a file from
 *
 * @param from
 * @param to
 * @param param2
 */
export async function hfsCopyFile(
  from: string,
  to: string,
  { restrictedTo }: FileOpsOptions,
) {
  if (restrictedTo) {
    if (!isPathInside(from, restrictedTo)) {
      throw new Error("Could not copy the requested file.");
    }
    if (!isPathInside(to, restrictedTo)) {
      throw new Error("Could not copy the requested file.");
    }
  }

  return await copyFile(from, to);
}
