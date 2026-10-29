import { setupQueue } from "server/database/setupQueue";
import { cronQueue } from "../cronQueue";
import { RestoreComponent } from "./backupFileNames";

const WEEK_SECONDS = 7 * 24 * 60 * 60;
const ACTIVE_CRON_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Compose services that are stopped while data is restored.
 */
export const restoreStoppedServices = ["web-host", "editor-api", "puppeteer"];

/**
 * The request that starts a restore.
 */
export interface RestoreRequest {
  /**
   * Restore point id. Example: `5-3-2026/12`
   */
  pointId: string;
  components: RestoreComponent[];
  includeSessions?: boolean;
  /**
   * Only validate and log the plan. Nothing is stopped or changed.
   */
  dryRun?: boolean;
}

/**
 * Data of the jobs created by the restore flow.
 */
export interface RestoreJobData {
  runId: string;
  date: string;
  hour: number;
  includeSessions?: boolean;
  startDragonFly?: boolean;
}

/**
 * This queue runs the restore jobs from the core container.
 *
 * Jobs are never retried. A failed restore must stay visible and
 * the stopped services must not be started against partly restored data.
 */
export const restoreQueue = setupQueue("core", "restore", {
  attempts: 1,
  removeOnComplete: {
    age: WEEK_SECONDS,
    count: 250,
  },
  removeOnFail: {
    age: WEEK_SECONDS,
    count: 250,
  },
});

/**
 * Check if a restore is queued or running.
 *
 * @returns
 */
export async function hasActiveRestore() {
  const jobs = await restoreQueue.queue.getJobs([
    "active",
    "waiting",
    "waiting-children",
    "delayed",
    "prioritized",
  ]);

  return jobs.length > 0;
}

/**
 * Pause the cron queue and wait for the running cron jobs to finish.
 *
 * This keeps a scheduled backup from running while data is restored.
 * The queue is resumed when the restore finishes. When a restore fails it stays
 * paused, so no backup is made of partly restored data.
 *
 * @param log
 */
export async function pauseCronQueue(log: (message: string) => void) {
  await cronQueue.queue.pause();
  log("Paused the cron queue.");

  const deadline = Date.now() + ACTIVE_CRON_TIMEOUT_MS;
  let active = await cronQueue.queue.getActiveCount();

  while (active > 0) {
    if (Date.now() > deadline) {
      await cronQueue.queue.resume();
      throw new Error("Timed out waiting for running cron jobs to finish.");
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    active = await cronQueue.queue.getActiveCount();
    log(`Active cron jobs: ${active}`);
  }
}

/**
 * Resume the cron queue after a restore.
 *
 * @param log
 */
export async function resumeCronQueue(log: (message: string) => void) {
  await cronQueue.queue.resume();
  log("Resumed the cron queue.");
}
