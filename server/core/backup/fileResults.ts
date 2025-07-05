import { formatStorageSize } from "common/format/storageSize";
import { stat } from "fs/promises";

/**
 * Backup file results.
 *
 * @param file
 * @returns
 */
export async function backupFileResults(file: string) {
  // get the file size on disk
  const stats = await stat(file);

  return {
    file,
    size: stats.size,
    hSize: formatStorageSize(stats.size),
    lastModified: stats.mtime,
  };
}
