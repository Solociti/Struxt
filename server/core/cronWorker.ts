import { setupWorker } from "server/database/setupQueue";
import { cronQueue } from "./cronQueue";
import { Job } from "bullmq";
import { backupMongodb } from "./backup/mongoDb";

if (process.env.CONTAINER_NAME !== "core") {
  throw new Error("This script should only be run in the core container.");
}

setupWorker(
  cronQueue.prefix,
  cronQueue.name,
  async (job: Job) => {
    switch (job.name) {
      case "backup-mongo-db":
        return await backupMongodb(job.data.dbName, {
          log: (message) => {
            job.log(message);
          },
          onProgress: (value, max) => {
            const percent = Math.round((value / max) * 100);

            job.updateProgress(percent);
          },
        });

      default:
        console.warn(`Unknown job name: ${job.name}`);
        break;
    }
  },
  {
    concurrency: 1,
  }
);
