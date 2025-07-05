import { getS3BackupClient } from "server/hfs/s3/getS3Client";
import { upSyncS3Directory } from "server/hfs/s3/syncS3Dir";
import {
  getBackupDir,
  getBasePublishDir,
  getUploadDir,
} from "server/utils/uploadDir";

/**
 * Syncs the local uploads directory to an S3 bucket.
 *
 * @param log
 */
export async function syncS3Uploads(
  log: (message: string) => void,
  progress: (value: number, max: number) => void
) {
  const { bucket, client } = await getS3BackupClient();

  log("Syncing uploads to S3...");
  log(`Using bucket: ${bucket}`);

  const localDir = getUploadDir();
  log(`Local upload directory: ${localDir}`);

  const result = await upSyncS3Directory(client, localDir, bucket, "uploads", {
    log,
    progress,
    deleteRemote: true,
  });
  log("Uploads synced successfully.");

  return result;
}

/**
 * Syncs the published project sites to an S3 bucket.
 *
 * @param log
 * @param progress
 * @returns
 */
export async function syncS3Sites(
  log: (message: string) => void,
  progress: (value: number, max: number) => void
) {
  const { bucket, client } = await getS3BackupClient();

  log("Syncing sites to S3...");
  log(`Using bucket: ${bucket}`);

  const localDir = getBasePublishDir();
  log(`Local upload directory: ${localDir}`);

  const result = await upSyncS3Directory(client, localDir, bucket, "sites", {
    log,
    progress,
    deleteRemote: true,
  });
  log("Sites synced successfully.");

  return result;
}

/**
 * Upload the local backups directory to an S3 bucket.
 *
 * @param log
 * @param progress
 * @returns
 */
export async function syncS3Backups(
  log: (message: string) => void,
  progress: (value: number, max: number) => void
) {
  const { bucket, client } = await getS3BackupClient();

  log("Uploading backups to S3...");
  log(`Using bucket: ${bucket}`);

  const localDir = getBackupDir();
  log(`Local backup directory: ${localDir}`);

  const result = await upSyncS3Directory(client, localDir, bucket, "backups", {
    log,
    progress,
    deleteRemote: false,
  });
  log("Backups uploaded successfully.");

  return result;
}
