import { setupQueue } from "../database/setupQueue";

export const cronPrefix = "cron";
export const cronName = "cron";

const { queue } = setupQueue(cronPrefix, cronName, {
  attempts: 2,
  backoff: {
    type: "exponential",
    delay: 10000,
  },
  removeOnComplete: 50,
  removeOnFail: 50,
});

export { queue };

queue.upsertJobScheduler(
  "downloadPasswordLists",
  { pattern: "20 3 2 * *" },
  {
    data: { cron: true },
  }
);
