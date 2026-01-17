import { setupQueue } from "server/database/setupQueue";

export const assetsQueue = setupQueue("projects", "assets", {
  removeOnComplete: 250,
  removeOnFail: 250,
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 30000,
  },
});

(() => {
  if (process.env.CONTAINER_NAME !== "editor-api") {
    return;
  }

  assetsQueue.queue.upsertJobScheduler(
    "purge-deleted-assets",
    {
      every: 6 * 60 * 60 * 1000,
    },
    {
      data: { cron: true },
      opts: {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 10 * 60 * 1000,
        },
      },
    }
  );
})();
