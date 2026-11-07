import { ProjectModel } from "common/models/projects/ProjectModel";
import { cronQueue } from "server/core/cronQueue";
import { getCollection } from "server/database/mongodb";

/**
 * Find and delete projects marked as deleted and due for permanent deletion
 *
 * @param log
 */
export async function purgeDeletedProjects(log: (msg: string) => void) {
  // get projects to purge
  const collection = await getCollection<ProjectModel>("projects");

  const now = Math.floor(Date.now() / 1000);
  const cursor = collection.find({
    "deleted.active": true,
    "deleted.purgeDate": { $lte: now },
  });

  let count = 0;

  while (await cursor.hasNext()) {
    count++;

    const doc = await cursor.next();
    const project = new ProjectModel(doc as any);

    log(`Delete Project: ${project.projectId}`);
    await cronQueue.queue.add(
      "purge-project",
      {
        projectId: project.projectId,
      },
      {
        attempts: 3,
        backoff: 5000,
        delay: 10 * 1000 * count,
      },
    );
  }

  log(`Total: ${count}`);
}
