import { customError } from "common/custom-error/custom-error";
import { AssetModel } from "common/models/assets/AssetModel";
import { existsSync } from "node:fs";
import { rename, unlink } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { getCollection } from "server/database/mongodb";
import { rmDirIfEmpty } from "server/hfs/dirOps";
import { isPathInside } from "server/hfs/path";
import { mkDirRecursive } from "server/utils/mkDir";
import { getProjectFilesDir } from "server/utils/uploadDir";
import { getAsset } from "./getAssets";
import { saveAsset } from "./saveAsset";

/**
 * Delete an asset from the project
 *
 * @param uuid
 * @param user
 */
export async function deleteAsset(
  uuid: string,
  projectId: string,
  user: { userId: string; displayName: string },
) {
  const asset = await getAsset(uuid, projectId);
  if (!asset) {
    throw customError(404, "Asset not found.");
  }

  if (asset.deleted.active) {
    throw customError(400, "Asset is already deleted.");
  }

  // mark the asset as deleted
  asset.deleted = {
    ...asset.deleted,
    active: true,
    date: Math.floor(Date.now() / 1000),
    originalPath: asset.path,
    ...user,
  };

  // move local assets to the trash
  if (!asset.isExternalSrc) {
    const projectDir = getProjectFilesDir(projectId);
    const currentFilePath = join(projectDir, asset.path);

    if (!isPathInside(currentFilePath, projectDir)) {
      throw customError(400, "Invalid file path.");
    }

    const ext = extname(asset.path);
    const trashFileName = `${asset.uuid}${ext}`;
    const trashDir = join(projectDir, ".trash");
    await mkDirRecursive(trashDir);

    const trashFilePath = join(trashDir, trashFileName);

    if (existsSync(currentFilePath)) {
      await rename(currentFilePath, trashFilePath);
    }

    // delete the empty directory if it is empty
    await rmDirIfEmpty(dirname(currentFilePath), true, projectDir);

    asset.path = `/.trash/${trashFileName}`;
  }

  return await saveAsset(asset);
}

/**
 * Handle restoring an asset from the trash
 *
 * @param uuid
 * @param projectId
 */
export async function restoreAsset(uuid: string, projectId: string) {
  const asset = await getAsset(uuid, projectId);
  if (!asset) {
    throw customError(404, "Asset not found.");
  }

  if (!asset.deleted.active) {
    throw customError(400, "Could not restore file. Asset is not in trash.");
  }

  if (!asset.isExternalSrc) {
    if (!asset.deleted.originalPath) {
      throw customError(
        500,
        "Could not restore file. Original path not found.",
      );
    }

    // check if a file with the same name exists first
    const projectDir = getProjectFilesDir(projectId);
    const filePath = join(projectDir, asset.deleted.originalPath);
    const trashFilePath = join(projectDir, asset.path);

    if (!isPathInside(filePath, projectDir)) {
      throw customError(400, "Invalid file path.");
    }

    if (existsSync(filePath)) {
      throw customError(
        400,
        "Could not restore file to original location. An asset already exists there.",
      );
    }

    if (!existsSync(trashFilePath)) {
      throw customError(
        500,
        "Could not restore file. Asset not found in trash.",
      );
    }

    // move the file back to the original location
    await mkDirRecursive(dirname(filePath));
    await rename(trashFilePath, filePath);

    asset.path = asset.deleted.originalPath;
  }

  asset.deleted.active = false;
  asset.deleted.originalPath = "";

  return await saveAsset(asset);
}

/**
 * Permanently delete an asset from the project
 *
 * @param uuid
 * @param projectId
 */
export async function permanentlyDeleteAsset(uuid: string, projectId: string) {
  // get the asset
  const asset = await getAsset(uuid, projectId);
  if (!asset) {
    throw customError(404, "Asset not found.");
  }

  if (!asset.isExternalSrc) {
    // delete the physical file from disk
    const projectDir = getProjectFilesDir(projectId);
    const trashFilePath = join(projectDir, asset.path);

    if (existsSync(trashFilePath)) {
      await unlink(trashFilePath);

      // delete the empty directory if it is empty
      await rmDirIfEmpty(dirname(trashFilePath), true, projectDir);
    }
  }

  // delete the asset from the database
  const collection = await getCollection<AssetModel>("assets");
  await collection.deleteOne({
    uuid,
    projectId,
  });
}
