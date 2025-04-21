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

// add the cron job to download the geoip database
queue.upsertJobScheduler(
  "update-geoip",
  {
    pattern: "5 4 * * 2",
  },
  {
    data: { cron: true },
    opts: {
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 10 * 60 * 1000,
      },
      removeOnComplete: 10,
      removeOnFail: 10,
    },
  }
);
