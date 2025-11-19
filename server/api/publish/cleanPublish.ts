import { PublishModel } from "common/models/projects/PublishModel";
import { getCollection, toArray } from "server/database/mongodb";
import { cleanDir } from "server/utils/cleanDir";
import { getPublishDir } from "server/utils/uploadDir";

/**
 * Clean up the old publish files for a project
 *
 * @param projectId
 */
export async function cleanPublish(projectId: string) {
  // get the list of publishes that haven't been cleared yet
  const unclearedPublishes = await getUnclearedPublishes(projectId);

  const collection = await getCollection<PublishModel>("projects_published");

  // delete the publish files
  for (const publish of unclearedPublishes) {
    const publishDir = getPublishDir(projectId, publish.siteEnv, publish.uuid);
    await cleanDir(publishDir);

    await collection.updateOne(
      {
        uuid: publish.uuid,
      },
      {
        $set: {
          cleared: {
            active: true,
            date: Math.floor(Date.now() / 1000),
          },
        },
      },
      {
        upsert: false,
      }
    );
  }
}

/**
 * Get the list of uncleared publishes for a project
 *
 * @param projectId
 * @returns
 */
async function getUnclearedPublishes(projectId: string) {
  const collection = await getCollection<PublishModel>("projects_published");

  const cursor = await collection.find({
    projectId,
    "cleared.active": {
      $ne: true,
    },
    isActive: false,
  });

  const docs = await toArray(cursor);

  return docs.map((doc) => new PublishModel(doc));
}
