import { AssetModel } from "common/models/assets/AssetModel";
import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import { defaultFilesForRuntime } from "common/models/routines/runtimes";
import { getRoutineEnvList } from "server/routines/env/getRoutineEnv";
import { saveRoutineEnv } from "server/routines/env/saveRoutineEnv";
import { listEnvironments as listFissionEnvironments } from "server/routines/fission/environment";
import { getRuntimeFromEnv } from "server/routines/fission/runtimes";
import { createSimpleId } from "server/utils/createId";
import { createIndex, getCollection } from "../mongodb";

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

  await createIndex(
    "project_secrets",
    { varUuid: 1 },
    { unique: true, name: "var_uuid_unique_index" },
  );
  await createIndex(
    "project_secrets",
    {
      projectId: 1,
      siteEnv: 1,
      key: 1,
    },
    { unique: true, name: "project_env_key_unique_index" },
  );

  await createIndex(
    "project_keys",
    {
      projectId: 1,
      siteEnv: 1,
    },
    { unique: true, name: "project_env_unique_index" },
  );
}

export async function down() {}
