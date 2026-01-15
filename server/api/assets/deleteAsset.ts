import { AssetModel } from "common/models/assets/AssetModel";
import { getCollection } from "server/database/mongodb";

/**
 * Delete an asset from the project
 *
 * @param uuid
 * @param user
 */
export async function deleteAsset(
  uuid: string,
  projectId: string,
  user: { userId: string; displayName: string }
) {
  const collection = await getCollection("assets");

  const deleted: AssetModel["deleted"] = {
    active: true,
    date: Math.floor(Date.now() / 1000),
    ...user,
  };

  const result = await collection.updateOne(
    {
      uuid,
      projectId,
    },
    {
      $set: {
        deleted,
      },
    },
    {
      upsert: false,
    }
  );

  if (result.modifiedCount !== 1) {
    throw new Error("Failed to delete asset.");
  }

  // delete the asset from the file system
  // TODO: implement this

  return true;
}
