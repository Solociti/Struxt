import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Get the routine environment by uuid
 *
 * @param uuid
 * @returns returns the Model or null if not found
 */
export async function getRoutineEnv(uuid: string) {
  const collection = await getCollection<RoutineEnvModel>(
    "fission_environments",
  );

  const doc = await collection.findOne({ uuid });
  if (!doc) {
    return null;
  }

  return new RoutineEnvModel(doc);
}

/**
 * Get the routine environment by its Fission environment name
 *
 * @param name e.g. `node-22`
 * @returns returns the Model or null if not found
 */
export async function getRoutineEnvByName(name: string) {
  const collection = await getCollection<RoutineEnvModel>(
    "fission_environments",
  );

  const doc = await collection.findOne({ name });
  if (!doc) {
    return null;
  }

  return new RoutineEnvModel(doc);
}

/**
 * Get the list of all routine environments
 *
 * @returns
 */
export async function getRoutineEnvList() {
  const collection = await getCollection<RoutineEnvModel>(
    "fission_environments",
  );

  const cursor = collection.find({});
  const docs = await toArray(cursor);

  return docs.map((doc) => new RoutineEnvModel(doc));
}
