import { AssetModel } from "common/models/assets/AssetModel";
import { getFileType } from "common/models/assets/FileExtensions";
import { getCollection, toArray } from "server/database/mongodb";
import { EditorAsset } from "common/models/assets/EditorAsset";

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

    const item: EditorAsset = {
      uuid: asset.uuid,
      type: getFileType(asset.getFileExtension()),
      src: asset.getUrl(),
      name: asset.name,
    };

    if (asset.dimensions.width > 0 && asset.dimensions.height > 0) {
      item.width = asset.dimensions.width;
      item.height = asset.dimensions.height;
    }

    return item;
  });
}
