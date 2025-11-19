import { PublishModel } from "common/models/projects/PublishModel";
import { getCollection, toArray } from "server/database/mongodb";
import { cleanDir } from "server/utils/cleanDir";
import { getPublishDir } from "server/utils/uploadDir";

/**
 * Clean up the old publish files for a project
 *
 * @param projectId
 * @param log
 */
export async function cleanPublish(
  projectId: string,
  log: (msg: string) => void
) {
  // get the list of publishes that haven't been cleared yet
  const unclearedPublishes = await getUnclearedPublishes(projectId);

  const collection = await getCollection<PublishModel>("projects_published");

  // delete the publish files
  for (const publish of unclearedPublishes) {
    try {
      const publishDir = getPublishDir(
        projectId,
        publish.siteEnv,
        publish.uuid
      );
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
    } catch (err) {
      if (err instanceof Error) {
        log(`${err.name}: ${err.message}`);
      } else {
        log(JSON.stringify(err));
      }
    }
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

  const cursor = await collection
    .find({
      projectId,
      "cleared.active": {
        $ne: true,
      },
      isActive: false,
    })
    .limit(10);

  const docs = await toArray(cursor);

  return docs.map((doc) => new PublishModel(doc));
}
