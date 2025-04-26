import { PublishModel } from "common/models/projects/PublishModel";
import { getCollection } from "server/database/mongodb";

/**
 * Save the publish data to the database
 *
 * @param data
 */
export async function savePublish(data: PublishModel) {
  if (!data.uuid) {
    throw new Error("UUID is required");
  }

  const collection = await getCollection("projects_published");
  await collection.updateOne(
    {
      uuid: data.uuid,
    },
    {
      $set: data,
    },
    {
      upsert: true,
    }
  );
}
