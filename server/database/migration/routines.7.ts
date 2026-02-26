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

  // setup the default node-js fission environments

  await createIndex(
    "fission_environments",
    { uuid: 1 },
    { unique: true, name: "uuid_unique_index" },
  );
  await createIndex(
    "fission_environments",
    { name: 1 },
    { unique: true, name: "name_unique_index" },
  );

  await setupRoutineEnvs();
}

export async function down() {}

async function setupRoutineEnvs() {
  const routineEnvs = await listFissionEnvironments();
  const currentRoutineEnvs = await getRoutineEnvList();

  for (const env of routineEnvs) {
    // check if there are any existing routines with same name
    if (currentRoutineEnvs.find((e) => e.name === env.metadata.name)) {
      continue;
    }

    // check if there is an existing routine with the same runtime
    const runtime = getRuntimeFromEnv(env);
    const runtimeExists = currentRoutineEnvs.find((e) => e.runtime === runtime);

    const uuid = await createSimpleId("routine");

    const routineEnv = new RoutineEnvModel({
      uuid,
      name: env.metadata.name,
      displayName: env.metadata.name,
      runtime: runtime || "nodejs",
      isDefault: !runtimeExists,
      files: defaultFilesForRuntime(runtime || "nodejs"),
    });

    currentRoutineEnvs.push(routineEnv);

    await saveRoutineEnv(routineEnv);
  }
}
