import { customError } from "common/custom-error/custom-error";
import { AssetModel } from "common/models/assets/AssetModel";
import { reWriteAssetPath } from "common/models/assets/reWriteAssetPath";
import { basename, dirname, extname, join, normalize } from "common/path/path";
import { existsSync } from "node:fs";
import { rmDirIfEmpty } from "server/hfs/dirOps";
import { hfsCopyFile, hfsRenameFile } from "server/hfs/fileOps";
import { isPathInside } from "server/hfs/path";
import { createSimpleId } from "server/utils/createId";
import { mkDirRecursive } from "server/utils/mkDir";
import { getProjectFilesDir } from "server/utils/uploadDir";
import { isAssetPathUnique } from "./assetPathOps";
import { deleteAsset } from "./deleteAsset";
import { getAsset, getAssetByPath } from "./getAssets";
import { saveAsset } from "./saveAsset";

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
  operation: "move" | "copy",
  user: { userId: string; displayName: string },
) {
  const projectDir = getProjectFilesDir(projectId);

  // ensure that the destination path is not inside the source path
  if (
    (operation === "move" || onConflict !== "rename") &&
    fromPath === toPath
  ) {
    throw customError(400, `Cannot ${operation} to the same location.`);
  }

  if (operation === "move" && isPathInside(toPath, fromPath)) {
    throw customError(400, `Cannot ${operation} to a sub-directory of itself.`);
  }

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
    let asset = await getAsset(uuid, projectId);
    if (!asset) {
      throw customError(404, "A given asset was not found.");
    }

    if (asset.deleted.active) {
      throw customError(
        400,
        `Asset (${asset.path}) is deleted and cannot be moved.`,
      );
    }

    if (operation === "copy") {
      // for copy ops, we need to clone the current asset with a new uuid, since we will be creating a new asset
      asset = asset.clone();
      asset.uuid = await createSimpleId("asset");
      asset.created = {
        date: Math.floor(Date.now() / 1000),
        userId: user.userId,
        displayName: user.displayName,
      };
    }

    let path = reWriteAssetPath(asset.path, fromPath, toPath);

    /**
     * This is the path where the asset will be moved to
     */
    let fullPath = join(projectDir, path);
    /**
     * The current on disk path of the asset. Will become the old path after move
     */
    const oldPath = join(projectDir, asset.path);
    let deleteAssetUuid: string | undefined = undefined;

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

    const isUnique = await isAssetPathUnique(projectId, asset.uuid, path);
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
          let baseFileName = basename(path, ext);
          if (/\(\d{1,}\)$/.test(baseFileName)) {
            baseFileName = baseFileName.replace(/\(\d{1,}\)$/, "");
          }

          const dir = dirname(path);

          index++;
          const newFileName = `${baseFileName}(${index})${ext}`;

          path = normalize(join(dir, newFileName));
          fullPath = join(projectDir, path);
        } while (!(await isAssetPathUnique(projectId, asset.uuid, path)));
      }

      if (onConflict === "throw") {
        throw customError(400, `Asset path conflict for (${path}).`);
      }

      if (onConflict === "overwrite") {
        // we need to delete the existing asset that is being overwritten
        const existingAsset = await getAssetByPath(projectId, path);
        if (existingAsset) {
          deleteAssetUuid = existingAsset.uuid;
        } else {
          // fallback to skipping
          skipped.push(asset);
          continue;
        }
      }
    }

    operations.push({
      uuid: asset.uuid,
      oldFullPath: oldPath,
      newPath: path,
      fullPath,
      asset,
      deleteAsset: deleteAssetUuid,
    });
  }

  const dirs: string[] = [];

  // perform the move operations
  for (const op of operations) {
    if (op.deleteAsset) {
      await deleteAsset(op.deleteAsset, projectId, user);
    }

    // move the file on disk
    const dir = dirname(op.fullPath);
    await mkDirRecursive(dir);

    const oldDir = dirname(op.oldFullPath);
    if (!dirs.includes(oldDir)) {
      dirs.push(oldDir);
    }

    if (operation === "copy") {
      await hfsCopyFile(op.oldFullPath, op.fullPath, {
        restrictedTo: projectDir,
      });
    } else {
      await hfsRenameFile(op.oldFullPath, op.fullPath, {
        restrictedTo: projectDir,
      });
    }

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

  if (operation === "move") {
    for (const dir of dirs) {
      // try to remove the old directories if they are empty
      await rmDirIfEmpty(dir, true, projectDir);
    }
  }

  return {
    skipped,
    completed: operations.map((op) => op.asset),
  };
}
