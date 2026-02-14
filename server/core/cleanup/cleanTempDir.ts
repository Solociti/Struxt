import { lstat, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { getTempDir } from "server/utils/uploadDir";

const MAX_AGE = 60 * 60 * 1000;

/**
 * Recursively delete any files older then 1 hour in the temp dir
 */
export async function cleanTempDir(log: (msg: string) => void) {
  let fileCount = 0;
  let dirCount = 0;
  let deletedCount = 0;
  let deletedBytes = 0;

  const cleanDir = async (dir: string) => {
    const files = await readdir(dir);

    for (const file of files) {
      // slow down a bit to avoid hitting to many files
      await new Promise((resolve) => setTimeout(resolve, 100));

      const filePath = join(dir, file);
      const stats = await lstat(filePath);

      if (stats.isDirectory()) {
        dirCount++;
        await cleanDir(filePath);
      } else {
        fileCount++;
        const age = Date.now() - stats.mtime.getTime();
        if (age > MAX_AGE) {
          deletedCount++;
          deletedBytes += stats.size;

          log(`Deleting: ${filePath}`);
          await unlink(filePath);
        }
      }
    }
  };

  await cleanDir(getTempDir());

  return {
    fileCount,
    dirCount,
    deletedCount,
    deletedBytes,
  };
}
