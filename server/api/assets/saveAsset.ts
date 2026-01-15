import { AssetModel } from "common/models/assets/AssetModel";
import { getCollection } from "server/database/mongodb";

/**
 * Save the asset to the database
 *
 * @param asset
 * @returns
 */
export async function saveAsset(asset: AssetModel) {
  const collection = await getCollection<AssetModel>("assets");

  const result = await collection.updateOne(
    {
      uuid: asset.uuid,
    },
    {
      $set: asset,
    },
    {
      upsert: true,
    }
  );

  return result.modifiedCount > 0 || result.upsertedCount > 0;
}
