import { RoutineListItem, RoutineModel } from "common/models/routines/Routine";
import { getCollection, toArray } from "server/database/mongodb";

const listItemProjection: Record<keyof RoutineListItem, 1 | 0 | -1> = {
  uuid: 1,
  name: 1,
  path: 1,
  updated: 1,
};

/**
 * Get the list of routines for the provided project.
 *
 * @param projectId
 * @returns
 */
export async function getRoutineList(projectId: string) {
  const collection = await getCollection<RoutineModel>("routines");

  // get the list of routines for the project
  const cursor = collection.find(
    {
      projectId,
      "archived.active": false,
    },
    { projection: listItemProjection }
  );
  const list = await toArray(cursor);
  return list;
}
