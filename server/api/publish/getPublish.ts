import { EnvironmentTypes } from "common/models/projects/Environment";
import { PublishModel } from "common/models/projects/PublishModel";
import { getCollection } from "server/database/mongodb";

/**
 * Get the latest publish data for the given project and environment
 *
 * @param projectId
 * @param projectEnv
 * @returns
 */
export async function getLatestPublish(
  projectId: string,
  projectEnv: EnvironmentTypes
) {
  const collection = await getCollection<PublishModel>("projects_published");

  const doc = await collection.findOne(
    {
      projectId,
      siteEnv: projectEnv,
    },
    {
      sort: { "created.date": -1 },
    }
  );
  if (!doc) {
    return null;
  }

  return new PublishModel(doc);
}
