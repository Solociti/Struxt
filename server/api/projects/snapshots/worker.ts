import { Job } from "bullmq";
import { setupWorker } from "server/database/setupQueue";
import { getProjectIds, purgeEditorSnapshots } from "./purgeEditorSnapshots";
import { snapshotQueues } from "./queues";
import { validEventTypes } from "./snapshotUtils";

setupWorker(
  snapshotQueues.prefix,
  snapshotQueues.name,
  async (job: Job) => {
    console.log("Editor snapshot worker", job);

    switch (job.name) {
      case "schedule-purge":
        const projectIds = await getProjectIds();

        await job.log(`Projects: ${projectIds.length}`);

        let index = 0;
        for (const projectId of projectIds) {
          index++;

          await snapshotQueues.queue.addBulk(
            validEventTypes.map((eventType) => {
              return {
                name: "purge-snapshots",
                data: { projectId, eventType },
                opts: {
                  delay: 500 * index,
                },
              };
            })
          );
        }

        return;

      case "purge-snapshots":
        const { projectId, eventType } = job.data;

        return await purgeEditorSnapshots(projectId, eventType, async (msg) => {
          await job.log(msg);
        });

      default:
        throw new Error("Invalid job name");
    }
  },
  {
    concurrency: 1,
  }
);
