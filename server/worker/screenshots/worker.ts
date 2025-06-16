import { Job } from "bullmq";
import { setupWorker } from "server/database/setupQueue";
import { createSiteScreenshot } from "./createSiteScreenshot";

if (process.env.CONTAINER_NAME !== "puppeteer") {
  throw new Error("This worker should only run in the puppeteer container.");
}

setupWorker(
  "projects",
  "puppeteer-screenshots",
  async (job: Job) => {
    const { url, options } = job.data;

    if (!url) {
      return {
        error: "URL is required to take a screenshot.",
      };
    }

    const screenshotPath = await createSiteScreenshot(url, options, (msg) =>
      job.log(msg)
    );
    return { screenshotPath };
  },
  {
    concurrency: 1,
  }
);
