import { readdir, rmdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { getBackupDir } from "server/utils/uploadDir";

/**
 * Cleans up local backup files that are older than a specified number of days.
 *
 * @param log
 */
export async function cleanLocalBackups(
  log: (message: string) => void
): Promise<void> {
  const keepDays = parseInt(process.env.BACKUP_KEEP_LOCAL_DAYS || "1");
  const keepMs = keepDays * 24 * 60 * 60 * 1000;

  log(`Cleaning local backups older than ${keepDays} days...`);

  const backupDir = getBackupDir();
  const files = await readdir(backupDir, {
    withFileTypes: true,
    recursive: true,
  });

  const fileCount = files.filter((file) => file.isFile()).length;
  log(`Found ${fileCount} files in backup directory: ${backupDir}`);

  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }

    const filePath = join(file.parentPath, file.name);
    const stats = await stat(filePath);
    const age = Date.now() - stats.mtimeMs;

    if (age > keepMs) {
      log(`Deleting: ${filePath}`);
      await unlink(filePath);
    }
  }

  // remove empty directories
  for (const file of files) {
    if (file.isDirectory()) {
      // check if directory is empty
      const dirPath = join(file.parentPath, file.name);
      const dirFiles = await readdir(dirPath);
      if (dirFiles.length === 0) {
        log(`Deleting: ${dirPath}`);
        await rmdir(dirPath);
      }
    }
  }
}
