import { Job } from "bullmq";
import { setupWorker } from "server/database/setupQueue";
import { purgeDeletedAssets } from "./purgeDeletedAssets";
import { assetsQueue } from "./queue";

setupWorker(
  assetsQueue.prefix,
  assetsQueue.name,
  async (job: Job) => {
    switch (job.name) {
      case "purge-deleted-assets":
        return await purgeDeletedAssets(job);

      default:
        throw new Error("Invalid job name");
    }
  },
  {
    concurrency: 1,
  }
);
