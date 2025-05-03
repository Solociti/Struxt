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

/**
 * Set the active publish for the given project and environment.
 *
 * @param publishId
 */
export async function setActivePublish(publishId: string) {
  const collection = await getCollection<PublishModel>("projects_published");
  await collection.updateOne(
    {
      uuid: publishId,
    },
    {
      $set: {
        isActive: true,
      },
    }
  );

  const publish = await collection.findOne(
    {
      uuid: publishId,
    },
    {
      projection: {
        projectId: 1,
        siteEnv: 1,
      },
    }
  );
  if (!publish) {
    return;
  }

  const { projectId, siteEnv } = publish;
  await collection.updateMany(
    {
      projectId: projectId,
      siteEnv: siteEnv,
      uuid: { $ne: publishId },
      isActive: true,
    },
    {
      $set: {
        isActive: false,
      },
    }
  );
}
