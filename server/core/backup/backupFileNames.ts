/**
 * Backup components that are stored as files in the backup directory.
 */
export type BackupFileComponent =
  | "mongo"
  | "dragonfly"
  | "victoriametrics"
  | "grafana"
  | "nginx";

/**
 * Components that can be restored.
 *
 * `uploads` and `sites` are restored from S3.
 */
export const restoreComponents = [
  "mongo",
  "victoriametrics",
  "grafana",
  "nginx",
  "uploads",
  "sites",
  "dragonfly",
] as const;

export type RestoreComponent = (typeof restoreComponents)[number];

/**
 * The components restored when the user does not select any.
 *
 * DragonFly only holds queues and caches, so it must be selected explicitly.
 */
export const defaultRestoreComponents: RestoreComponent[] =
  restoreComponents.filter((component) => component !== "dragonfly");

const BACKUP_DATE_REGEX = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;

/**
 * Check if a directory name is a backup date directory. Example: `5-3-2026`
 *
 * @param name
 * @returns
 */
export function isBackupDate(name: string) {
  return BACKUP_DATE_REGEX.test(name);
}

/**
 * Convert a backup date directory name to a sortable number.
 *
 * @param date
 * @returns
 */
export function backupDateValue(date: string) {
  const match = BACKUP_DATE_REGEX.exec(date);
  if (!match) {
    return 0;
  }
  const [, day, month, year] = match;
  return Number(year) * 10000 + Number(month) * 100 + Number(day);
}

/**
 * Parse the name of a file created by the backup jobs.
 *
 * @param name file name without directories
 * @returns null when the file is not a backup file
 */
export function parseBackupFileName(name: string): {
  hour: number;
  component: BackupFileComponent;
  dbName?: string;
} | null {
  let match = /^(\d{1,2})\.dragonfly\.tar\.gz$/.exec(name);
  if (match) {
    return { hour: Number(match[1]), component: "dragonfly" };
  }

  match = /^(\d{1,2})-victoria-metrics\.tar\.gz$/.exec(name);
  if (match) {
    return { hour: Number(match[1]), component: "victoriametrics" };
  }

  match = /^(\d{1,2})-grafana\.tar\.gz$/.exec(name);
  if (match) {
    return { hour: Number(match[1]), component: "grafana" };
  }

  match = /^(\d{1,2})-nginx\.tar\.gz$/.exec(name);
  if (match) {
    return { hour: Number(match[1]), component: "nginx" };
  }

  match = /^(\d{1,2})-([\w.-]+)\.mongodb\.gz$/.exec(name);
  if (match) {
    return { hour: Number(match[1]), component: "mongo", dbName: match[2] };
  }

  return null;
}

/**
 * Parse a restore point id. Example: `5-3-2026/12`
 *
 * @param id
 * @returns null when the id is malformed
 */
export function parseRestorePointId(id: unknown) {
  if (typeof id !== "string") {
    return null;
  }

  const [date, hourText, ...rest] = id.split("/");
  if (rest.length > 0 || !isBackupDate(date) || !/^\d{1,2}$/.test(hourText)) {
    return null;
  }

  const hour = Number(hourText);
  if (hour > 23) {
    return null;
  }

  return { date, hour };
}
