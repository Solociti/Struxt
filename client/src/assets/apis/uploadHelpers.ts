import { BlobReader, BlobWriter, ZipReader } from "@zip.js/zip.js";
import { createNewAsset, saveAssetContent } from "client/assets/assetApis";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { join, normalize } from "common/path/path";

export interface ZipFileEntry {
  /**
   * The path of the file inside the zip archive (e.g., "folder/file.txt")
   */
  filename: string;

  /**
   * The project path where this entry will be stored (e.g., /uploads/folder/file.txt)
   */
  path: string;
}

/**
 * Get list of files in a zip archive without extracting them
 *
 * @param file - The zip file to read
 * @param baseDir - The base directory to prepend to file paths
 * @returns Array of file entries with their relative paths
 */
export async function getZipFileEntries(
  file: File,
  baseDir: string,
): Promise<ZipFileEntry[]> {
  const zipReader = new ZipReader(new BlobReader(file));
  const entries = await zipReader.getEntries();

  const fileEntries: ZipFileEntry[] = [];

  for (const entry of entries) {
    if (entry.directory) {
      continue;
    }

    const path = normalize(join(baseDir, entry.filename));

    fileEntries.push({
      filename: entry.filename,
      path,
    });
  }

  await zipReader.close();
  return fileEntries;
}

/**
 * Process files from a zip archive with a callback
 * Opens the zip once and processes all requested files sequentially
 *
 * @param zipFile - The zip file to extract from
 * @param entryFilenames - Array of filenames to extract
 * @param callback - Async callback called for each extracted file
 */
export async function processZipFiles(
  zipFile: File,
  entryFilenames: string[],
  callback: (filename: string, blob: Blob) => Promise<void>,
): Promise<void> {
  const zipReader = new ZipReader(new BlobReader(zipFile));
  const entries = await zipReader.getEntries();

  try {
    for (const filename of entryFilenames) {
      const entry = entries.find((e) => e.filename === filename);

      if (!entry || entry.directory || !entry.getData) {
        throw new Error(`File not found in zip: ${filename}`);
      }

      const blob = await entry.getData(new BlobWriter());
      await callback(filename, blob);
    }
  } finally {
    await zipReader.close();
  }
}

/**
 * Upload a single file to the project
 *
 * @param projectId - The project ID to upload to
 * @param file - The file or blob to upload
 * @param path - The project path where the file should be stored (e.g., /src/file.js)
 * @returns The created asset model
 *
 * @remarks
 * TODO: Binary file support - saveAssetContent currently only accepts text content.
 * Need to modify the endpoint to handle binary data for images, videos, etc.
 */
export async function uploadFile(
  projectId: string,
  file: File | Blob,
  path: string,
) {
  let asset: AssetModel | null = null;
  let tryCount = 0;

  while (tryCount < 3) {
    try {
      if (!asset) {
        asset = await createNewAsset(projectId, {
          path: path,
        });
      }

      const content = await file.text();
      await saveAssetContent(projectId, asset.uuid, content);

      return asset;
    } catch (error) {
      tryCount++;
      if (tryCount >= 3) {
        throw error;
      }

      let wait = 100 * Math.pow(tryCount, 2);

      // handle rate limit errors
      if (error instanceof Error && error.status === 429) {
        wait = 1000 * Math.pow(tryCount, 2);
      }
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  throw new Error("Upload failed after 3 attempts");
}

/**
 * Filter files to only those that should be uploaded based on extraction settings
 *
 * @param files - Array of files with their upload metadata
 * @returns Filtered array containing only files that should be uploaded
 */
export function getFilesToUpload<
  T extends {
    localId: number;
    shouldExtract?: boolean;
    hasCollision?: boolean;
    overwrite?: boolean;
    sourceZipId?: number;
  },
>(files: T[]): T[] {
  return files.filter((f) => {
    if (f.hasCollision && !f.overwrite) {
      return false;
    }
    if (f.shouldExtract) {
      return false;
    }
    if (typeof f.sourceZipId === "number") {
      const sourceZip = files.find((file) => file.localId === f.sourceZipId);
      if (!sourceZip?.shouldExtract) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Upload multiple files, handling zip extraction if needed
 *
 * @param projectId - The project ID to upload to
 * @param basePath - Base path to prepend to relative file paths
 * @param files - Array of file items with upload metadata (paths are relative)
 * @param onProgress - Callback for progress updates (file localId, status, error)
 */
export async function batchUploadFiles(
  projectId: string,
  basePath: string,
  files: Array<{
    localId: number;
    file: File | Blob;
    path: string;
    originalName: string;
    shouldExtract?: boolean;
    sourceZipId?: number;
    sourceZipFile?: File;
  }>,
  onProgress: (
    index: number,
    status: "uploading" | "complete" | "error",
    error?: string,
  ) => void,
): Promise<AssetListItem[]> {
  const uploadedAssets: AssetListItem[] = [];

  let i = 0;

  while (i < files.length) {
    const fileItem = files[i];

    if (fileItem.shouldExtract) {
      const zipFilesToUpload = files.filter(
        (f) => f.sourceZipId === fileItem.localId,
      );

      if (zipFilesToUpload.length > 0) {
        try {
          const entryFilenames = zipFilesToUpload.map((f) => f.originalName);

          await processZipFiles(
            fileItem.file as File,
            entryFilenames,
            async (filename, blob) => {
              const fileToUpload = zipFilesToUpload.find(
                (f) => f.originalName === filename,
              );

              if (!fileToUpload) return;

              const fileIndex = files.indexOf(fileToUpload);
              onProgress(fileIndex, "uploading");

              try {
                const fullPath = join(basePath, fileToUpload.path);
                const asset = await uploadFile(projectId, blob, fullPath);
                onProgress(fileIndex, "complete");
                uploadedAssets.push(asset.getListItem());
              } catch (error) {
                const errorMsg =
                  error instanceof Error ? error.message : "Upload failed";
                onProgress(fileIndex, "error", errorMsg);
              }
            },
          );
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Failed to process zip";
          for (const zipFile of zipFilesToUpload) {
            const fileIndex = files.indexOf(zipFile);
            onProgress(fileIndex, "error", errorMsg);
          }
        }
      }

      i++;
      continue;
    }

    if (typeof fileItem.sourceZipId === "number") {
      i++;
      continue;
    }

    onProgress(i, "uploading");

    try {
      const fullPath = join(basePath, fileItem.path);
      const asset = await uploadFile(projectId, fileItem.file, fullPath);
      onProgress(i, "complete");
      uploadedAssets.push(asset.getListItem());
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Upload failed";
      onProgress(i, "error", errorMsg);
    }

    i++;
  }

  return uploadedAssets;
}

/**
 * Calculate upload status summary
 *
 * @param files - Array of files to analyze
 * @param isUploading - Whether upload is currently in progress
 * @returns Status message string
 */
export function getUploadStatusMessage(
  files: Array<{
    status: "pending" | "uploading" | "complete" | "error";
    hasCollision?: boolean;
    overwrite?: boolean;
  }>,
  isUploading: boolean,
): string {
  const activeFiles = files.filter((f) => !(f.hasCollision && !f.overwrite));
  const skippedCount = files.length - activeFiles.length;

  if (activeFiles.length === 0) {
    return skippedCount > 0
      ? `${skippedCount} file${skippedCount !== 1 ? "s" : ""} skipped (collision${skippedCount !== 1 ? "s" : ""})`
      : "No files to upload";
  }

  const completedCount = files.filter((f) => f.status === "complete").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  if (isUploading) {
    return `Uploading ${completedCount} of ${files.length}`;
  }

  if (completedCount > 0 || errorCount > 0) {
    return `Complete: ${completedCount} uploaded${errorCount > 0 ? `, ${errorCount} errors` : ""}`;
  }

  return `${files.length} file${files.length !== 1 ? "s" : ""} ready`;
}
