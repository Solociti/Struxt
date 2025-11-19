import { dateToEpoch, epochToDate } from "common/format/date";
import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";

/**
 * The number of minutes to merge snapshots together.
 */
export const saveCompactMinutes = 15;

export const validEventTypes: EditorSnapshotModel["eventType"][] = [
  "staging",
  "production",
  "save",
  "restore",
] as const;

interface PurgeRule {
  keepRecentCount: number;
  dailyRetentionDays: number;
  monthlyRetentionMonths: number;
}

export const purgeRules: Record<EditorSnapshotModel["eventType"], PurgeRule> = {
  staging: {
    keepRecentCount: 5,
    dailyRetentionDays: 10,
    monthlyRetentionMonths: 5,
  },
  production: {
    keepRecentCount: 5,
    dailyRetentionDays: 10,
    monthlyRetentionMonths: 5,
  },
  save: {
    keepRecentCount: 5,
    dailyRetentionDays: 15,
    monthlyRetentionMonths: 0,
  },
  restore: {
    keepRecentCount: 3,
    dailyRetentionDays: 10,
    monthlyRetentionMonths: 0,
  },
};

/**
 * Get the compact date for a given time
 *
 * @param time
 * @returns
 */
export function getCompactDate(
  time: number,
  eventType?: EditorSnapshotModel["eventType"]
) {
  let compactMinutes = saveCompactMinutes;
  if (eventType === "restore") {
    compactMinutes = 1;
  }

  const date = epochToDate(time);
  date.setUTCMinutes(
    Math.floor(date.getUTCMinutes() / compactMinutes) * compactMinutes
  );
  date.setUTCSeconds(0, 0);
  return dateToEpoch(date);
}

/**
 * Epoch seconds for a given number of days ago
 *
 * @param days
 * @returns
 */
export function daysAgo(days: number) {
  const now = Date.now() / 1000;

  return Math.floor(now - days * 24 * 60 * 60);
}
