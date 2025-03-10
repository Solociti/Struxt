import { downloadPasswordLists } from "../auth/downloadPasswordLists.ts";
import { setupWorker } from "../database/setupQueue.ts";
import { cronName, cronPrefix } from "./queue.ts";

// setup a cron worker
setupWorker(
  cronPrefix,
  cronName,
  async (job) => {
    switch (job.name) {
      case "downloadPasswordLists": {
        await downloadPasswordLists(job);
        break;
      }
      default: {
        console.error("Unknown job type", job.name);
      }
    }
  },
  {
    concurrency: 1,
  }
);
