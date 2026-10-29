import { cronQueue } from "server/core/cronQueue";

const backupJobs: { name: string; priority: number; s3?: boolean }[] = [
  { name: "backup-mongo-db", priority: 1 },
  { name: "backup-nginx-proxy-manager", priority: 2 },
  { name: "sync-uploads-s3", priority: 3, s3: true },
  { name: "sync-sites-s3", priority: 3, s3: true },
  { name: "backup-victoriametrics", priority: 5 },
  { name: "backup-dragonfly", priority: 10 },
  { name: "backup-grafana", priority: 10 },
  { name: "sync-backups-s3", priority: 15, s3: true },
  { name: "cleanup-local-backups", priority: 20 },
];

/**
 * Schedule a manual backup.
 *
 * Adds the same jobs, with the same priorities, as the cron schedule.
 *
 * @returns the ids of the created jobs
 */
export async function scheduleBackup() {
  const includeS3 = process.env.BACKUP_UPLOAD_TO_S3 === "true";
  const ids: string[] = [];

  for (const { name, priority, s3 } of backupJobs) {
    if (s3 && !includeS3) {
      continue;
    }

    const job = await cronQueue.queue.add(name, {}, { priority, attempts: 1 });
    ids.push(String(job.id));
  }

  return ids;
}

/**
 * Get the state of backup jobs.
 *
 * @param ids job ids returned by {@link scheduleBackup}
 * @returns
 */
export async function getBackupStatus(ids: string[]) {
  const steps: { name: string; state: string; progress: number }[] = [];
  let failedReason: string | undefined;

  for (const id of ids) {
    const job = await cronQueue.queue.getJob(id);
    if (!job) {
      continue;
    }

    const state = await job.getState();
    steps.push({
      name: job.name,
      state,
      progress: typeof job.progress === "number" ? job.progress : 0,
    });

    if (state === "failed" && !failedReason) {
      failedReason = `${job.name}: ${job.failedReason}`;
    }
  }

  const done = steps.every(
    (step) => step.state === "completed" || step.state === "failed",
  );

  return {
    state: failedReason && done ? "failed" : done ? "completed" : "running",
    steps,
    failedReason,
  };
}
