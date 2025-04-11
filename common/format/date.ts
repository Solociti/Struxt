/**
 * Convert a date to epoch seconds
 *
 * @param date
 * @returns
 */
export function dateToEpoch(date: Date): number {
  // Convert the date to epoch time
  return new Date(date).getTime() / 1000;
}

/**
 * Convert epoch seconds to a date
 *
 * @param epoch
 * @returns
 */
export function epochToDate(epoch: number): Date {
  // Convert the epoch time to a date
  const date = new Date(0);
  date.setUTCSeconds(epoch);
  return date;
}

/**
 * Convert a date to human readable format
 *
 * @param date
 * @returns
 */
export function formatDate(
  date: Date | string | number,
  time?: boolean
): string {
  if (typeof date === "number") {
    date = epochToDate(date);
  }
  if (typeof date === "string") {
    date = new Date(date);
  }

  // Format the date to a more readable format
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: time ? "2-digit" : undefined,
    minute: time ? "2-digit" : undefined,
  });
}
