import { downSyncS3Directory } from "server/hfs/s3/downSyncS3Dir";
import { getS3BackupClient } from "server/hfs/s3/getS3Client";
import { upSyncS3Directory } from "server/hfs/s3/syncS3Dir";
import {
  getBackupDir,
  getBasePublishDir,
  getUploadDir,
} from "server/utils/uploadDir";
import { parseBackupFileName } from "./backupFileNames";

/**
 * Syncs the local uploads directory to an S3 bucket.
 *
 * @param log
 */
export async function syncS3Uploads(
  log: (message: string) => void,
  progress: (value: number, max: number) => void,
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

  return {
    bucketFiles: result.bucketFiles.length,
    localFiles: result.localFiles.length,
    uploadedFiles: result.uploadFiles.length,
    deleteFiles: result.deleteBucketFiles.length,
  };
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
  progress: (value: number, max: number) => void,
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

  return {
    bucketFiles: result.bucketFiles.length,
    localFiles: result.localFiles.length,
    uploadedFiles: result.uploadFiles.length,
    deleteFiles: result.deleteBucketFiles.length,
  };
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
  progress: (value: number, max: number) => void,
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

  return {
    bucketFiles: result.bucketFiles.length,
    localFiles: result.localFiles.length,
    uploadedFiles: result.uploadFiles.length,
    deleteFiles: result.deleteBucketFiles.length,
  };
}

/**
 * Download the uploads from S3 into the local uploads directory.
 *
 * @param log
 * @param progress
 */
export async function restoreS3Uploads(
  log: (message: string) => void,
  progress: (value: number, max: number) => void,
) {
  const { bucket, client } = await getS3BackupClient();

  log("Restoring uploads from S3...");
  const result = await downSyncS3Directory(
    client,
    bucket,
    "uploads",
    getUploadDir(),
    { log, progress },
  );
  log("Uploads restored successfully.");

  return {
    bucketFiles: result.bucketFiles.length,
    downloadedFiles: result.downloadFiles.length,
  };
}

/**
 * Download the published sites from S3 into the local sites directory.
 *
 * @param log
 * @param progress
 */
export async function restoreS3Sites(
  log: (message: string) => void,
  progress: (value: number, max: number) => void,
) {
  const { bucket, client } = await getS3BackupClient();

  log("Restoring sites from S3...");
  const result = await downSyncS3Directory(
    client,
    bucket,
    "sites",
    getBasePublishDir(),
    { log, progress },
  );
  log("Sites restored successfully.");

  return {
    bucketFiles: result.bucketFiles.length,
    downloadedFiles: result.downloadFiles.length,
  };
}

/**
 * Download the backup files of a single restore point from S3.
 *
 * @param date backup date directory. Example `5-3-2026`
 * @param hour
 * @param log
 * @param progress
 */
export async function restoreS3BackupFiles(
  date: string,
  hour: number,
  log: (message: string) => void,
  progress: (value: number, max: number) => void,
) {
  const { bucket, client } = await getS3BackupClient();

  log(`Downloading backup files for ${date}/${hour} from S3...`);
  const result = await downSyncS3Directory(
    client,
    bucket,
    `backups/${date}`,
    getBackupDir(date),
    {
      log,
      progress,
      filter: (relativePath) =>
        parseBackupFileName(relativePath)?.hour === hour,
    },
  );

  return {
    downloadedFiles: result.downloadFiles.length,
  };
}
