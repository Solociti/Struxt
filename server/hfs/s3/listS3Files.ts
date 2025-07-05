import { Client } from "minio";

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
    const stream = client.listObjects(bucket, prefix, true);

    stream.on("data", (obj) => {
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
    });

    stream.on("end", () => {
      resolve(files);
    });
  });
}
