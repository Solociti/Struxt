import { dateToEpoch, epochToDate } from "common/format/date";

/**
 * The number of minutes to merge snapshots together.
 */
export const saveCompactMinutes = 15;

export const validEventTypes = ["staging", "production", "save"];

/**
 * Get the compact date for a given time
 *
 * @param time
 * @returns
 */
export function getCompactDate(time: number) {
  const date = epochToDate(time);
  date.setUTCMinutes(
    Math.floor(date.getUTCMinutes() / saveCompactMinutes) * saveCompactMinutes
  );
  date.setUTCSeconds(0, 0);
  return dateToEpoch(date);
}
