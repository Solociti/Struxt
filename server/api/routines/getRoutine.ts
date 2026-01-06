import { RoutineModel } from "common/models/routines/Routine";
import { getCollection } from "server/database/mongodb";

/**
 * Get the routine for the provided project and uuid.
 *
 * @param projectId
 * @param uuid
 * @returns
 */
export async function getRoutine(projectId: string, uuid: string) {
  const collection = await getCollection<RoutineModel>("routines");

  // get the list of routines for the project
  const doc = await collection.findOne({
    projectId,
    uuid,
  });

  if (!doc) {
    return null;
  }

  return new RoutineModel(doc);
}
