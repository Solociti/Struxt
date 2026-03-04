import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectSecretModel } from "common/models/projects/ProjectSecret";
import { getCollection } from "server/database/mongodb";

/**
 * Removes a secret environment variable for a project from the secrets collection.
 *
 * This will not remove the variable from the project's environment variable list.
 *
 * @param projectId
 * @param env
 * @param varUuid
 */
export async function removeProjectEnvSecret(
  projectId: string,
  env: EnvironmentTypes,
  varUuid: string,
) {
  const collection = await getCollection<ProjectSecretModel>("project_secrets");

  const result = await collection.deleteOne({
    projectId,
    siteEnv: env,
    varUuid,
  });

  return result.deletedCount > 0;
}
