import { setupWorker } from "server/database/setupQueue";
import { createSiteScreenshot } from "./createSiteScreenshot";

setupWorker(
  "projects",
  "puppeteer-screenshots",
  async (job) => {
    const { url, options } = job.data;

    if (!url) {
      return {
        error: "URL is required to take a screenshot.",
      };
    }

    const screenshotPath = await createSiteScreenshot(url, options);
    return { screenshotPath };
  },
  {
    concurrency: 1,
  }
);
