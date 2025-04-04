import { roundNumber } from "./number";

/**
 * Format a number of bytes into a human-readable string.
 *
 * @param bytes
 * @returns
 */
export function formatStorageSize(bytes: number): string {
  const sizes = ["KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 KB";
  }

  const kb = bytes / 1024;

  const i = Math.floor(Math.log(kb) / Math.log(1024));
  return roundNumber(kb / Math.pow(1024, i), 1) + " " + sizes[i];
}
