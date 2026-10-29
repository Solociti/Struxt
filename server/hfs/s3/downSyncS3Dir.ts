import { Client } from "minio";
import { mkdir, stat, utimes } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { listS3Files } from "./listS3Files";

/**
 * Download the files of an S3 prefix into a local directory.
 *
 * Files are downloaded when they are missing locally or their size differs.
 * Nothing is deleted locally.
 *
 * @param client
 * @param bucket
 * @param prefix
 * @param localDir
 * @param options
 * @param options.filter only download the objects where this returns true. Receives the path relative to the prefix.
 */
export async function downSyncS3Directory(
  client: Client,
  bucket: string,
  prefix: string,
  localDir: string,
  options: {
    log?: (message: string) => void;
    progress?: (value: number, max: number) => void;
    filter?: (relativePath: string) => boolean;
  } = {},
) {
  options.progress?.(0, 1);

  const bucketFiles = await listS3Files(client, bucket, prefix);
  const baseDir = resolve(localDir);

  const downloads: {
    objectName: string;
    localPath: string;
    lastModified: Date | null;
  }[] = [];

  for (const bFile of bucketFiles) {
    const relativePath = relative(prefix, bFile.name);
    if (options.filter && !options.filter(relativePath)) {
      continue;
    }

    const localPath = resolve(join(baseDir, relativePath));
    if (!localPath.startsWith(baseDir + sep)) {
      options.log?.(`Skipping unsafe object name: ${bFile.name}`);
      continue;
    }

    const localStat = await stat(localPath).catch(() => null);
    if (!localStat || localStat.size !== bFile.size) {
      downloads.push({
        objectName: bFile.name,
        localPath,
        lastModified: bFile.lastModified,
      });
    }
  }

  options.log?.(
    `Bucket Count "${bucket}" with prefix "${prefix}": ${bucketFiles.length}`,
  );
  options.log?.(`Download Count: ${downloads.length}`);

  let completed = 0;
  options.progress?.(0, downloads.length || 1);

  for (const { objectName, localPath, lastModified } of downloads) {
    options.log?.(`Downloading: ${objectName} (${localPath})`);

    await mkdir(dirname(localPath), { recursive: true });
    await client.fGetObject(bucket, objectName, localPath);
    if (lastModified) {
      await utimes(localPath, lastModified, lastModified);
    }

    completed++;
    options.progress?.(completed, downloads.length);
  }

  return {
    bucketFiles,
    downloadFiles: downloads,
  };
}
