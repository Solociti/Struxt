import { AssetModel } from "common/models/assets/AssetModel";
import { getCollection } from "../mongodb";

export async function up() {
  const collection = await getCollection<AssetModel>("assets");

  // iterate over all assets and update the /assets/filename.png to /public/assets/filename.png

  const cursor = collection.find({});
  for await (const doc of cursor) {
    const asset = new AssetModel(doc);
    if (asset.isExternalSrc) {
      continue;
    }
    if (!asset.path.startsWith("/assets/")) {
      continue;
    }
    asset.path = `/public${asset.path}`;

    await collection.updateOne(
      { uuid: asset.uuid },
      { $set: { path: asset.path } },
    );
  }
}

export async function down() {}
