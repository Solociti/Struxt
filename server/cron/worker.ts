import { downloadPasswordLists } from "../auth/downloadPasswordLists";
import { setupWorker } from "../database/setupQueue";
import { cronName, cronPrefix } from "./queue";

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
