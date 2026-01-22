import { customError } from "common/custom-error/custom-error";
import { AssetModel } from "common/models/assets/AssetModel";
import { UserModelAction } from "common/models/Model";
import { getCollection } from "server/database/mongodb";

/**
 * Save the asset to the database
 *
 * @param asset
 * @returns
 */
export async function saveAsset(asset: AssetModel) {
  const collection = await getCollection<AssetModel>("assets");

  try {
    const result = await collection.updateOne(
      {
        uuid: asset.uuid,
      },
      {
        $set: asset,
      },
      {
        upsert: true,
      },
    );

    return result.modifiedCount > 0 || result.upsertedCount > 0;
  } catch (err: Error | unknown) {
    if (err instanceof Error) {
      if (err.message.startsWith("E11000 duplicate key error collection")) {
        throw customError(
          400,
          "Asset already exists. Please try renaming and saving again.",
        );
      }
    }
    throw err;
  }
}

/**
 * Update the updated date for the asset
 *
 * @param uuid
 * @param projectId
 * @param action
 * @returns
 */
export async function updateUpdatedDate(
  uuid: string,
  projectId: string,
  action: Omit<UserModelAction, "active">,
) {
  const collection = await getCollection<AssetModel>("assets");

  const result = await collection.updateOne(
    {
      uuid,
      projectId,
    },
    {
      $set: {
        updated: action,
      },
    },
  );

  return result.modifiedCount > 0;
}
