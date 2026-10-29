import { readdir, stat } from "node:fs/promises";
import { getS3BackupClient } from "server/hfs/s3/getS3Client";
import { listS3Files } from "server/hfs/s3/listS3Files";
import { getBackupDir } from "server/utils/uploadDir";
import {
  backupDateValue,
  isBackupDate,
  parseBackupFileName,
  parseRestorePointId,
  RestoreComponent,
} from "./backupFileNames";
import { restoreS3BackupFiles } from "./syncS3";

export interface RestorePoint {
  /**
   * `{date}/{hour}`. Example: `5-3-2026/12`
   */
  id: string;
  date: string;
  hour: number;
  source: "local" | "s3" | "both";
  components: RestoreComponent[];
  sizeBytes: number;
}

type PointMap = Map<
  string,
  {
    date: string;
    hour: number;
    components: Set<RestoreComponent>;
    sizeBytes: number;
  }
>;

/**
 * Add a backup file to the map of restore points.
 *
 * @param points
 * @param date
 * @param fileName
 * @param size
 */
function addFile(
  points: PointMap,
  date: string,
  fileName: string,
  size: number,
) {
  const parsed = parseBackupFileName(fileName);
  if (!parsed) {
    return;
  }

  const id = `${date}/${parsed.hour}`;
  const point = points.get(id) || {
    date,
    hour: parsed.hour,
    components: new Set<RestoreComponent>(),
    sizeBytes: 0,
  };
  point.components.add(parsed.component);
  point.sizeBytes += size;
  points.set(id, point);
}

/**
 * Find the restore points in the local backup directory.
 *
 * @returns
 */
async function listLocalPoints() {
  const points: PointMap = new Map();
  const backupDir = getBackupDir();

  const dirs = await readdir(backupDir, { withFileTypes: true }).catch(
    () => [],
  );

  for (const dir of dirs) {
    if (!dir.isDirectory() || !isBackupDate(dir.name)) {
      continue;
    }

    const files = await readdir(getBackupDir(dir.name), {
      withFileTypes: true,
    });
    for (const file of files) {
      if (file.isFile()) {
        const { size } = await stat(getBackupDir(dir.name, file.name));
        addFile(points, dir.name, file.name, size);
      }
    }
  }

  return points;
}

/**
 * Find the restore points stored in the S3 `backups/` prefix.
 *
 * @returns
 */
async function listS3Points() {
  const points: PointMap = new Map();
  if (process.env.BACKUP_UPLOAD_TO_S3 !== "true") {
    return points;
  }

  const { bucket, client } = await getS3BackupClient();
  const files = await listS3Files(client, bucket, "backups/");

  for (const file of files) {
    const [, date, fileName, ...rest] = file.name.split("/");
    if (rest.length === 0 && date && isBackupDate(date) && fileName) {
      addFile(points, date, fileName, file.size);
    }
  }

  return points;
}

/**
 * List the available restore points, newest first.
 *
 * Only points that include a MongoDB backup are returned.
 *
 * @returns
 */
export async function listRestorePoints(): Promise<RestorePoint[]> {
  const local = await listLocalPoints();
  const s3 = await listS3Points();
  const s3Enabled = process.env.BACKUP_UPLOAD_TO_S3 === "true";

  const ids = new Set([...local.keys(), ...s3.keys()]);
  const list: RestorePoint[] = [];

  for (const id of ids) {
    const localPoint = local.get(id);
    const s3Point = s3.get(id);
    const base = (localPoint || s3Point)!;

    const components = new Set<RestoreComponent>([
      ...(localPoint?.components || []),
      ...(s3Point?.components || []),
    ]);
    if (!components.has("mongo")) {
      continue;
    }
    if (s3Enabled) {
      components.add("uploads");
      components.add("sites");
    }

    list.push({
      id,
      date: base.date,
      hour: base.hour,
      source: localPoint && s3Point ? "both" : localPoint ? "local" : "s3",
      components: [...components],
      sizeBytes: Math.max(localPoint?.sizeBytes || 0, s3Point?.sizeBytes || 0),
    });
  }

  return list.sort(
    (a, b) =>
      backupDateValue(b.date) - backupDateValue(a.date) || b.hour - a.hour,
  );
}

/**
 * Find a restore point by id.
 *
 * @param id
 * @returns undefined when the id is malformed or the point does not exist
 */
export async function findRestorePoint(id: unknown) {
  if (!parseRestorePointId(id)) {
    return undefined;
  }

  const points = await listRestorePoints();
  return points.find((point) => point.id === id);
}

/**
 * Make sure the backup files of a restore point are in the local backup directory.
 *
 * @param point
 * @param log
 * @param progress
 */
export async function ensureBackupFilesLocal(
  point: RestorePoint,
  log: (message: string) => void,
  progress: (value: number, max: number) => void,
) {
  if (point.source === "local") {
    return;
  }

  await restoreS3BackupFiles(point.date, point.hour, log, progress);
}
