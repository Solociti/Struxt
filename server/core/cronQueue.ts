import { setupQueue } from "server/database/setupQueue";

/**
 * This queue is used to run scheduled jobs from the core container.
 *
 * Jobs can be scheduled from any container.
 *
 * Jobs registered here, should be reserved to administrative tasks,
 * such as backups.
 * *__File cleanup should be registered in the normal cron queue.__
 */
export const cronQueue = setupQueue("core", "cron", {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5 * 60 * 1000,
  },
  removeOnComplete: {
    age: 7 * 24 * 60 * 60 * 1000,
    count: 250,
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60 * 1000,
    count: 250,
  },
});

/**
 * Register a cron job with the given name, data, and pattern.
 *
 * @param name
 * @param data
 * @param pattern
 * @returns
 */
async function registerJob(name: string, data: Object, pattern: string) {
  if (process.env.BACKUP_ENABLED !== "true") {
    await cronQueue.queue.removeJobScheduler(name);
    return;
  }

  await cronQueue.queue.upsertJobScheduler(
    name,
    { pattern },
    {
      name,
      data,
      opts: {
        attempts: 1,
      },
    }
  );
}

/**
 * Setup the cron jobs.
 *
 * Will only run in the core container.
 *
 * @returns
 */
export function setupCronJobs() {
  if (process.env.CONTAINER_NAME !== "core") {
    return;
  }

  // setup cron jobs
  // Schedule the database backup as per the settings
  const pattern = process.env.BACKUP_CRON || "15 0,12 * * *";

  // backup mongodb
  registerJob("backup-mongo-db", {}, pattern);

  // backup dragonfly
  registerJob("backup-dragonfly", {}, pattern);

  // backup victoriametrics
  registerJob("backup-victoriametrics", {}, pattern);

  // backup grafana
  registerJob("backup-grafana", {}, pattern);

  // backup nginx proxy manager
  registerJob("backup-nginx-proxy-manager", {}, pattern);
}
