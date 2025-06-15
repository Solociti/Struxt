import { setupQueue } from "server/database/setupQueue";

export const puppeteerScreenshotQueue = setupQueue(
  "projects",
  "puppeteer-screenshots",
  {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 20000,
    },
    removeOnComplete: 10,
    removeOnFail: 10,
  }
);
