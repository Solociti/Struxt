import { AssetModel } from "common/models/assets/AssetModel";
import { getCollection, toArray } from "server/database/mongodb";

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
  });

  const list = await toArray(cursor);
  return list.map((doc) => {
    const asset = new AssetModel(doc);
    return asset.getEditorAsset();
  });
}
