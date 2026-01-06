import { getApi, postApi } from "client/api/api";
import {
  RoutinesFilesCreateApi,
  RoutinesFilesEditApi,
  RoutinesFilesListApi,
} from "common/api/routines/routines";
import { RoutineModel } from "common/models/routines/Routine";

/**
 * Create a new routine at the specified name and path.
 *
 * @param projectId
 * @param values
 * @returns
 */
export async function createNewRoutine(
  projectId: string,
  values: RoutinesFilesCreateApi["PostBody"]
) {
  const response = await postApi<RoutinesFilesCreateApi>(
    ["/api/routines", projectId, "create-file"],
    {
      ...values,
    }
  );

  return response.item;
}

/**
 * Get the routine for the provided project and uuid.
 *
 * @param projectId
 * @param uuid
 * @returns
 */
export async function getRoutine(projectId: string, uuid: string) {
  const response = await getApi<RoutinesFilesEditApi>(
    ["/api/routines", projectId, "file"],
    { uuid }
  );

  return new RoutineModel(response.routine);
}

/**
 * Get the list of routines for the provided project.
 *
 * @param projectId
 * @returns
 */
export async function getRoutineList(projectId: string) {
  const response = await getApi<RoutinesFilesListApi>([
    "/api/routines",
    projectId,
    "list",
  ]);

  return response.list;
}

/**
 * Save the provided routine to the database.
 *
 * @param routine
 * @returns
 */
export async function saveRoutine(routine: RoutineModel) {
  const response = await postApi<RoutinesFilesEditApi>(
    ["/api/routines", routine.projectId, "file"],
    {
      routine,
    }
  );

  return response;
}
