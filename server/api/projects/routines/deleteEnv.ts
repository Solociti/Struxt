import { ProjectModel } from "common/models/projects/ProjectModel";
import { getCollection } from "server/database/mongodb";
import { getProjectDetails } from "../getProjectDetails";

/**
 * Deletes a routine environment from the project feature flags and returns the updated project details.
 *
 * @param projectId
 * @param envUuid
 * @returns
 */
export async function deleteProjectRoutinesEnv(
  projectId: string,
  envUuid: string,
) {
  const collection = await getCollection<ProjectModel>("projects");

  await collection.updateOne(
    { projectId },
    { $pull: { "featureFlags.routines.environments": { uuid: envUuid } } },
  );

  return getProjectDetails(projectId);
}
