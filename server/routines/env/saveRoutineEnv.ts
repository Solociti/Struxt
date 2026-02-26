import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import { getCollection } from "server/database/mongodb";

/**
 * Save the given routine env to database
 *
 * @param env
 */
export async function saveRoutineEnv(env: RoutineEnvModel) {
  const collection = await getCollection<RoutineEnvModel>(
    "fission_environments",
  );

  if (!env.uuid) {
    throw new Error("Routine environment must have a uuid");
  }
  if (!env.name) {
    throw new Error("Routine environment must have a name");
  }
  if (!env.runtime) {
    throw new Error("Routine environment must have a runtime");
  }

  if (!env.displayName) {
    env.displayName = env.name;
  }

  const result = await collection.updateOne(
    { uuid: env.uuid },
    { $set: env },
    { upsert: true },
  );

  if (result.acknowledged) {
    // ensure only one default environment exists per runtime
    if (env.isDefault) {
      await collection.updateMany(
        { runtime: env.runtime, uuid: { $ne: env.uuid } },
        { $set: { isDefault: false } },
      );
    }

    return true;
  }

  return result.acknowledged;
}
