import { AssetModel } from "common/models/assets/AssetModel";
import { Job } from "bullmq";
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { getCollection, toArray } from "server/database/mongodb";
import { getProjectFilesDir } from "server/utils/uploadDir";

const RETENTION_DAYS = 7;

/**
 * Purge assets that have been deleted for more than RETENTION_DAYS
 *
 * @param job
 * @returns
 */
export async function purgeDeletedAssets(job: Job) {
  const cutoffDate =
    Math.floor(Date.now() / 1000) - RETENTION_DAYS * 24 * 60 * 60;

  const collection = await getCollection<AssetModel>("assets");
  const cursor = collection
    .find({
      "deleted.active": true,
      "deleted.date": { $lt: cutoffDate },
    })
    .limit(250);

  const assets = await toArray(cursor);

  await job.log(`Found ${assets.length} assets`);

  let purgedCount = 0;
  let errorCount = 0;

  for (const assetDoc of assets) {
    try {
      const asset = new AssetModel(assetDoc);

      if (!asset.isExternalSrc) {
        const filePath = join(getProjectFilesDir(asset.projectId), asset.path);

        if (existsSync(filePath)) {
          await unlink(filePath);
          await job.log(`Deleted: (${asset.uuid}) ${asset.path}`);
        } else {
          await job.log(
            `File not found, skipping: (${asset.uuid}) ${asset.path}`
          );
        }
      } else {
        await job.log(`Deleted: (${asset.uuid})`);
      }

      await collection.deleteOne({
        uuid: asset.uuid,
        projectId: asset.projectId,
      });

      purgedCount++;
    } catch (error) {
      errorCount++;
      await job.log(`Error ${assetDoc.uuid}: ${error}`);
    }
  }

  return {
    purged: purgedCount,
    errors: errorCount,
  };
}
