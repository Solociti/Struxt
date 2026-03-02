import {
  ProjectFeatureFlags,
  ProjectModel,
} from "common/models/projects/ProjectModel";
import { getCollection } from "server/database/mongodb";
import { getProjectDetails } from "../getProjectDetails";

/**
 * Updates a routine environment in the project feature flags and returns the updated project details.
 *
 * @param projectId
 * @param envSettings
 * @returns
 */
export async function updateProjectRoutinesEnv(
  projectId: string,
  envSettings: ProjectFeatureFlags["routines"]["environments"][number],
) {
  const collection = await getCollection<ProjectModel>("projects");

  const result = await collection.updateOne(
    { projectId, "featureFlags.routines.environments.uuid": envSettings.uuid },
    { $set: { "featureFlags.routines.environments.$": envSettings } },
  );

  if (result.matchedCount === 0) {
    await collection.updateOne(
      { projectId },
      { $push: { "featureFlags.routines.environments": envSettings } },
    );
  }

  return await getProjectDetails(projectId);
}
