import { roundNumber } from "./number";

/**
 * Format a number of bytes into a human-readable string.
 *
 * @param bytes
 * @returns
 */
export function formatStorageSize(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 B";
  }

  let i = 0;
  // Flip to next unit if value is >= 0.5 of that unit (512 of current unit)
  while (bytes >= 512 && i < sizes.length - 1) {
    bytes /= 1024;
    i++;
  }

  return roundNumber(bytes, 1) + " " + sizes[i];
}
