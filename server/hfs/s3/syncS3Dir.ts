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
    `Bucket Count "${bucket}" with prefix "${prefix}": ${bucketFiles.length}`
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
  options.log?.(`Local Count "${localDir}": ${localFiles.length}`);

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
  options.log?.(`Upload Count: ${uploadFiles.length}`);

  // check which files need to be downloaded
  const deleteBucketFiles: {
    objectName: string;
  }[] = [];

  if (options.deleteRemote) {
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
    options.log?.(`Delete Count: ${deleteBucketFiles.length}`);
  }

  // upload the files that are not in the bucket
  const maxProgress = uploadFiles.length + deleteBucketFiles.length;
  let completed = 0;
  let consecutiveErrors = 0;
  let lastPushError: unknown | null = null;

  // setting the part size to something small to use less memory.
  // with default settings, a 1GB file took over 600MB of memory.
  const currentPartSize = client.partSize;
  client.partSize = 24 * 1024 * 1024;

  for (const { localFilePath, objectName, mTime } of uploadFiles) {
    try {
      options.log?.(`Uploading: ${objectName} (${localFilePath})`);

      await client.fPutObject(bucket, objectName, localFilePath, {
        struxtLastModified: mTime.toISOString(),
      });

      consecutiveErrors = 0;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes("no such file or directory")
      ) {
        options.log?.(
          `Skipping: ${objectName} (${localFilePath}) - file does not exist.`
        );
      } else {
        // log the error
        if (err instanceof Error) {
          options.log?.(`${err.name}: ${err.message}\n${err.stack}`);
        } else {
          options.log?.(JSON.stringify(err));
        }

        consecutiveErrors++;
        lastPushError = err;
        if (consecutiveErrors > 5) {
          throw err;
        }
      }
    }

    completed++;
    options.progress?.(completed, maxProgress);
  }
  client.partSize = currentPartSize;
  consecutiveErrors = 0;

  let lastDeleteError: unknown | null = null;

  if (options.deleteRemote) {
    // delete the files that are in the bucket but not in the local directory
    for (const { objectName } of deleteBucketFiles) {
      options.log?.(`Deleting Remote: ${objectName}`);

      try {
        await client.removeObject(bucket, objectName);

        consecutiveErrors = 0;
      } catch (err: unknown) {
        if (err instanceof Error) {
          // log the error
          options.log?.(`${err.name}: ${err.message}\n${err.stack}`);
        } else {
          options.log?.(JSON.stringify(err));
        }

        consecutiveErrors++;
        lastDeleteError = err;
        if (consecutiveErrors > 5) {
          throw err;
        }
      }

      completed++;
      options.progress?.(completed, maxProgress);
    }
  }

  if (lastPushError) {
    throw lastPushError;
  }
  if (lastDeleteError) {
    throw lastDeleteError;
  }

  return {
    bucketFiles,
    localFiles,
    uploadFiles,
    deleteBucketFiles,
  };
}
