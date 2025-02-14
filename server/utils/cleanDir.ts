import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";

/**
 * Recursively delete all files and directories in a directory
 *
 * @param dirPath
 */
export async function cleanDir(dirPath: string) {
  //    check if the directory exists
  const exits = await existsSync(dirPath);
  if (!exits) {
    return;
  }

  await rm(dirPath, { recursive: true });
}
