import { Client } from "minio";

const MAX_IDLE_TIME = 60000;

interface S3File {
  name: string;
  prefix: string;
  size: number;
  etag: string;
  lastModified: null | Date;
}
/**
 * Get a list of all files in an S3 bucket with a specific prefix.
 *
 * @param client
 * @param bucket
 * @param prefix
 * @returns
 */
export function listS3Files(
  client: Client,
  bucket: string,
  prefix: string = ""
): Promise<S3File[]> {
  return new Promise((resolve, reject) => {
    const files: S3File[] = [];
    const stream = client.listObjectsV2(bucket, prefix, true);

    // monitor the stream for activity
    let lastActivity = Date.now();
    const activityCheck = setInterval(() => {
      const idleTime = Date.now() - lastActivity;

      if (idleTime > MAX_IDLE_TIME) {
        stream.destroy(
          new Error(`S3 listing stream stalled for too long. (${idleTime}ms)`)
        );
        clearInterval(activityCheck);
      }
    }, 5000);

    stream.on("data", (obj) => {
      lastActivity = Date.now();

      if (!obj.name || obj.name === "") {
        return;
      }

      files.push({
        name: obj.name,
        prefix: obj.prefix || "",
        size: obj.size || 0,
        etag: obj.etag || "",
        lastModified: obj.lastModified || null,
      });
    });

    stream.on("error", (err) => {
      reject(err);
      clearInterval(activityCheck);
    });

    stream.on("end", () => {
      resolve(files);
      clearInterval(activityCheck);
    });
  });
}
