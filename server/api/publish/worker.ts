import { setupWorker } from "server/database/setupQueue";
import { cleanPublish } from "./cleanPublish";
import { publishQueue } from "./queue";

setupWorker(
  publishQueue.prefix,
  publishQueue.name,
  async (job) => {
    switch (job.name) {
      case "clean-publish":
        return await cleanPublish(job.data.projectId);

      default:
        throw new Error("Invalid job name");
    }
  },
  {
    concurrency: 1,
  }
);
