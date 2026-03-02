import { deleteApi, postApi } from "client/api/api";
import { ProjectRoutinesEnvApi } from "common/api/projects/projectRoutines";
import { ProjectFeatureFlags } from "common/models/projects/ProjectModel";

/**
 * Updates a routine environment in the project feature flags
 *
 * @param projectId
 * @param envSettings
 * @returns
 */
export async function updateProjectRoutinesEnv(
  projectId: string,
  envSettings: ProjectFeatureFlags["routines"]["environments"][number],
) {
  const response = await postApi<ProjectRoutinesEnvApi>(
    ["/api/projects", projectId, "routines/env"],
    {
      item: envSettings,
    },
  );

  return response;
}

/**
 * Removes a routine environment from the project feature flags
 *
 * @param projectId
 * @param envUuid
 * @returns
 */
export async function deleteProjectRoutinesEnv(
  projectId: string,
  envUuid: string,
) {
  const response = await deleteApi<ProjectRoutinesEnvApi>(
    ["/api/projects", projectId, "routines/env"],
    {
      uuid: envUuid,
    },
  );

  return response;
}
