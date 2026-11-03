import { AssetModel } from "common/models/assets/AssetModel";
import { getCollection } from "../mongodb";

export async function up() {
  // move all of the assets from the old directory to the new directory
  await moveAssets();
}

export async function down() {}

async function moveAssets() {
  const collection = await getCollection<AssetModel>("assets");
  const cursor = collection.find({});

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const asset = new AssetModel(doc as any);

    if (!asset.path || asset.isExternalSrc) {
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
