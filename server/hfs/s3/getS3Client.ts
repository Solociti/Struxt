import * as Minio from "minio";

/**
 * Get the backup client for S3.
 *
 * @returns
 */
export async function getS3BackupClient() {
  if (process.env.BACKUP_UPLOAD_TO_S3 !== "true") {
    throw new Error(
      "S3 uploads are not enabled. Set BACKUP_UPLOAD_TO_S3 to true in your environment variables."
    );
  }

  const missingKeys = [];
  if (!process.env.BACKUP_S3_ENDPOINT) {
    missingKeys.push("BACKUP_S3_ENDPOINT");
  }
  if (!process.env.BACKUP_S3_BUCKET) {
    missingKeys.push("BACKUP_S3_BUCKET");
  }
  if (!process.env.BACKUP_S3_ACCESS_KEY) {
    missingKeys.push("BACKUP_S3_ACCESS_KEY");
  }
  if (!process.env.BACKUP_S3_SECRET_KEY) {
    missingKeys.push("BACKUP_S3_SECRET_KEY");
  }

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables for S3: ${missingKeys.join(", ")}`
    );
  }

  const bucket = process.env.BACKUP_S3_BUCKET as string;

  const client = new Minio.Client({
    endPoint: process.env.BACKUP_S3_ENDPOINT as string,
    port: parseInt(process.env.BACKUP_S3_PORT || "443"),
    useSSL: process.env.BACKUP_S3_USE_SSL === "true",
    accessKey: process.env.BACKUP_S3_ACCESS_KEY as string,
    secretKey: process.env.BACKUP_S3_SECRET_KEY as string,
  });

  // Check if the bucket exists
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    throw new Error(
      `S3 bucket "${bucket}" does not exist. Please create it before syncing uploads.`
    );
  }

  return {
    bucket,
    client,
  };
}
