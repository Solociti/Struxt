import { Client } from "minio";
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { listS3Files } from "./listS3Files";

/**
 * Sync a local directory to an S3 bucket.
 *
 * This does not download files from the bucket.
 *
 * @param client
 * @param localDir
 * @param bucket
 * @param prefix
 */
export async function upSyncS3Directory(
  client: Client,
  localDir: string,
  bucket: string,
  prefix: string = "",
  options: {
    log?: (message: string) => void;
    progress?: (value: number, max: number) => void;
    deleteRemote?: boolean;
  }
) {
  options.progress?.(0, 1);

  const exists = await client.bucketExists(bucket);
  if (!exists) {
    throw new Error(`S3 bucket "${bucket}" does not exist.`);
  }

  // list the files already in the bucket
  const bucketFiles = await listS3Files(client, bucket, prefix);
  options.log?.(
    `Files in bucket "${bucket}" with prefix "${prefix}": ${bucketFiles.length}`
  );

  // get the list of files in the local directory
  let localFilesLs = await readdir(localDir, {
    withFileTypes: true,
    recursive: true,
  });
  const localFiles = localFilesLs
    .filter((lFile) => lFile.isFile())
    .map((lFile) => {
      const localFilePath = join(lFile.parentPath, lFile.name);
      const relativePath = relative(localDir, localFilePath);

      return {
        name: lFile.name,
        parentPath: lFile.parentPath,
        localFilePath,
        relativePath,
      };
    });
  options.log?.(`Files in local directory "${localDir}": ${localFiles.length}`);

  // check which files need to be uploaded
  const uploadFiles: {
    localFilePath: string;
    relativePath: string;
    objectName: string;
    mTime: Date;
  }[] = [];

  for (const { localFilePath, relativePath } of localFiles) {
    const existingBucketFile = bucketFiles.find((bFile) => {
      return bFile.name === join(prefix, relativePath);
    });

    const fileStat = await stat(localFilePath);

    let upload = !existingBucketFile;

    if (existingBucketFile) {
      // check if the local file is newer than the one in the bucket
      const localDate = new Date(0);
      localDate.setTime(fileStat.mtimeMs);

      if (
        !existingBucketFile.lastModified ||
        localDate > existingBucketFile.lastModified
      ) {
        upload = true;
      } else {
        upload = false;
      }
    }

    if (upload) {
      uploadFiles.push({
        localFilePath,
        relativePath,
        objectName: join(prefix, relativePath),
        mTime: fileStat.mtime,
      });
    }
  }
  options.log?.(`Files to upload: ${uploadFiles.length}`);

  // check which files need to be downloaded
  const deleteBucketFiles: {
    objectName: string;
  }[] = [];

  for (const bFile of bucketFiles) {
    const objectName = bFile.name;
    const relativePath = relative(prefix, objectName);

    const fileExists = localFiles.some((localFile) => {
      return localFile.relativePath === relativePath;
    });

    if (!fileExists) {
      deleteBucketFiles.push({
        objectName,
      });
    }
  }
  options.log?.(`Files to delete from bucket: ${deleteBucketFiles.length}`);

  // upload the files that are not in the bucket
  const maxProgress = uploadFiles.length + deleteBucketFiles.length;
  let completed = 0;

  for (const { localFilePath, objectName, mTime } of uploadFiles) {
    try {
      options.log?.(`Uploading file: ${objectName} (${localFilePath})`);
      await client.fPutObject(bucket, objectName, localFilePath, {
        struxtLastModified: mTime.toISOString(),
      });
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes("no such file or directory")
      ) {
        options.log?.(
          `Skipping file: ${objectName} (${localFilePath}) - file does not exist.`
        );
      } else {
        throw err;
      }
    }

    completed++;
    options.progress?.(completed, maxProgress);
  }

  if (options.deleteRemote) {
    // delete the files that are in the bucket but not in the local directory
    for (const { objectName } of deleteBucketFiles) {
      options.log?.(`Deleting file from bucket: ${objectName}`);
      await client.removeObject(bucket, objectName);

      completed++;
      options.progress?.(completed, maxProgress);
    }
  }

  return {
    existingFiles: bucketFiles,
    localFiles,
    uploadFiles,
  };
}
