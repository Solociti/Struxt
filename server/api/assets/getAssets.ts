import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import {
  getCollection,
  objectToProjection,
  toArray,
} from "server/database/mongodb";

/**
 * Get the given asset from the database
 *
 * @param uuid
 * @param projectId
 * @returns
 */
export async function getAsset(uuid: string, projectId: string) {
  const collection = await getCollection<AssetModel>("assets");
  const doc = await collection.findOne({
    uuid,
    projectId,
  });
  if (!doc) {
    return null;
  }

  return new AssetModel(doc);
}

/**
 * Get the list of assets for the given project specifically for the visual editor
 *
 * @param projectId
 * @returns
 */
export async function getEditorAssets(projectId: string) {
  const collection = await getCollection<AssetModel>("assets");
  const cursor = collection.find({
    projectId,
    "deleted.active": false,
    $or: [{ isExternalSrc: true }, { path: { $regex: /^\/assets\// } }],
  });

  const list = await toArray(cursor);
  return list.map((doc) => {
    const asset = new AssetModel(doc);
    return asset.getEditorAsset();
  });
}

/**
 * Get the list of assets for the given project specifically for the visual editor
 *
 * @param projectId
 * @returns
 */
export async function getAssetList(projectId: string) {
  const collection = await getCollection<AssetModel>("assets");
  const cursor = collection.find(
    {
      projectId,
    },
    {
      projection: objectToProjection(new AssetModel().getListItem()),
    },
  );

  const list = await toArray(cursor);
  return list as AssetListItem[];
}
