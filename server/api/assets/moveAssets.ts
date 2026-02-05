import { customError } from "common/custom-error/custom-error";
import { AssetModel } from "common/models/assets/AssetModel";
import { reWriteAssetPath } from "common/models/assets/reWriteAssetPath";
import { basename, dirname, extname, join, normalize } from "common/path/path";
import { existsSync } from "node:fs";
import { rename } from "node:fs/promises";
import { isPathInside } from "server/hfs/path";
import { getProjectFilesDir } from "server/utils/uploadDir";
import { isAssetPathUnique } from "./assetPathOps";
import { getAsset, getAssetByPath } from "./getAssets";
import { saveAsset } from "./saveAsset";
import { deleteAsset } from "./deleteAsset";

/**
 * Move the list of assets from one path to another
 *
 * @param projectId
 * @param assets
 * @param fromPath
 * @param toPath
 * @param onConflict
 */
export async function moveAssets(
  projectId: string,
  assets: { uuid: string }[],
  fromPath: string,
  toPath: string,
  onConflict: "skip" | "overwrite" | "rename" | "throw",
  user: { userId: string; displayName: string },
) {
  const projectDir = getProjectFilesDir(projectId);

  /**
   * The list of operations to perform
   */
  const operations: {
    uuid: string;
    oldFullPath: string;
    newPath: string;
    fullPath: string;
    asset: AssetModel;
    deleteAsset?: string;
  }[] = [];

  const skipped: AssetModel[] = [];

  // validate that all assets can be moved
  for (const { uuid } of assets) {
    const asset = await getAsset(uuid, projectId);
    if (!asset) {
      throw customError(404, "A given asset was not found.");
    }

    if (asset.deleted.active) {
      throw customError(
        400,
        `Asset (${asset.path}) is deleted and cannot be moved.`,
      );
    }

    let path = reWriteAssetPath(asset.path, fromPath, toPath);

    let fullPath = join(projectDir, path);
    const oldPath = join(projectDir, asset.path);
    let deleteAsset: string | undefined = undefined;

    if (
      !isPathInside(fullPath, projectDir) ||
      !isPathInside(oldPath, projectDir)
    ) {
      throw customError(400, "Invalid asset path.");
    }

    // verify that the old file exists on disk
    if (!existsSync(oldPath)) {
      throw customError(
        500,
        `Something went wrong. Could not load asset file. (${asset.path})`,
      );
    }

    const isUnique = await isAssetPathUnique(projectId, uuid, path);
    if (!isUnique) {
      if (onConflict === "skip") {
        skipped.push(asset);
        continue;
      }

      if (onConflict === "rename") {
        let index = 0;
        do {
          if (index > 100) {
            throw customError(
              500,
              "Could not resolve asset name conflict after multiple attempts.",
            );
          }

          const ext = extname(path);
          const baseFileName = basename(path, ext);
          const dir = dirname(path);

          index++;
          const newFileName = `${baseFileName}(${index})${ext}`;

          path = normalize(join(dir, newFileName));
          fullPath = join(projectDir, path);
        } while (!(await isAssetPathUnique(projectId, uuid, path)));
      }

      if (onConflict === "throw") {
        throw customError(400, `Asset path conflict for (${path}).`);
      }

      if (onConflict === "overwrite") {
        // we need to delete the existing asset that is being overwritten
        const existingAsset = await getAssetByPath(projectId, path);
        if (existingAsset) {
          deleteAsset = existingAsset.uuid;
        } else {
          // fallback to skipping
          continue;
        }
      }
    }

    operations.push({
      uuid,
      oldFullPath: oldPath,
      newPath: path,
      fullPath,
      asset,
      deleteAsset,
    });
  }

  // perform the move operations
  for (const op of operations) {
    if (op.deleteAsset) {
      await deleteAsset(op.deleteAsset, projectId, user);
    }

    // move the file on disk
    await rename(op.oldFullPath, op.fullPath);

    // update the asset path
    op.asset.path = op.newPath;
    op.asset.displayName = op.asset.getFileName();

    op.asset.updated = {
      ...op.asset.updated,
      date: Math.floor(Date.now() / 1000),
      ...user,
    };

    await saveAsset(op.asset);
  }

  return {
    skipped,
    completed: operations.map((op) => op.asset),
  };
}
