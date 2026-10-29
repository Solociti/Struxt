import { FlowChildJob, FlowJob, Job } from "bullmq";
import { stopDockerServices } from "server/core/docker/controlService";
import { createFlowProducer } from "server/database/setupQueue";
import { RestoreComponent } from "./backupFileNames";
import { ensureBackupFilesLocal, findRestorePoint } from "./restorePoints";
import {
  pauseCronQueue,
  RestoreJobData,
  restoreQueue,
  RestoreRequest,
  restoreStoppedServices,
} from "./restoreQueue";

const WEEK_SECONDS = 7 * 24 * 60 * 60;

const jobNameByComponent: Record<
  Exclude<RestoreComponent, "dragonfly">,
  string
> = {
  mongo: "restore-mongo-db",
  victoriametrics: "restore-victoriametrics",
  grafana: "restore-grafana",
  nginx: "restore-nginx",
  uploads: "restore-s3-uploads",
  sites: "restore-s3-sites",
};

/**
 * Schedule a restore.
 *
 * This only adds the `restore-kickoff` job. The kickoff job validates the
 * request and builds the job structure, see {@link runRestoreKickoff}.
 * It can also be added manually to the restore queue.
 *
 * @param request
 * @returns the id of the kickoff job, also used as the run id
 */
export async function scheduleRestore(request: RestoreRequest) {
  const job = await restoreQueue.queue.add("restore-kickoff", request);

  return String(job.id);
}

/**
 * Processor of the `restore-kickoff` job.
 *
 * Downloads the backup files from S3 when needed, pauses the cron queue,
 * stops the app services
 * and then schedules the data restore jobs. The services are started again
 * by the final `restore-finish` job once every restore job has completed.
 * When a restore job fails the services stay stopped.
 *
 * @param job
 */
export async function runRestoreKickoff(job: Job<RestoreRequest>) {
  const log = (message: string) => {
    job.log(message);
  };
  const request = job.data;
  const runId = String(job.id);

  const point = await findRestorePoint(request.pointId);
  if (!point) {
    throw new Error(`Restore point not found: ${request.pointId}`);
  }

  const components = [...new Set(request.components)];
  const unavailable = components.filter(
    (component) => !point.components.includes(component),
  );
  if (unavailable.length > 0) {
    throw new Error(
      `Not available in restore point ${point.id}: ${unavailable.join(", ")}`,
    );
  }

  log(`Restore point: ${point.id} (${point.source})`);
  log(`Components: ${components.join(", ") || "none"}`);

  if (request.dryRun) {
    log("Dry run. Nothing was changed.");
    return { dryRun: true };
  }

  await pauseCronQueue(log);

  await ensureBackupFilesLocal(point, log, (value, max) => {
    job.updateProgress(Math.round((value / max) * 100));
  });

  await stopDockerServices(restoreStoppedServices, log);

  const data: RestoreJobData = {
    runId,
    date: point.date,
    hour: point.hour,
    includeSessions: request.includeSessions,
  };

  const children: FlowChildJob[] = components
    .filter(
      (component): component is Exclude<RestoreComponent, "dragonfly"> =>
        component !== "dragonfly",
    )
    .map((component) => ({
      name: jobNameByComponent[component],
      queueName: restoreQueue.name,
      data,
      opts: {
        attempts: 1,
        failParentOnFailure: true,
        removeOnComplete: { age: WEEK_SECONDS, count: 250 },
        removeOnFail: { age: WEEK_SECONDS, count: 250 },
      },
    }));

  const flow: FlowJob = {
    name: "restore-finish",
    queueName: restoreQueue.name,
    data: { ...data, startDragonFly: components.includes("dragonfly") },
    opts: {
      attempts: 1,
      removeOnComplete: { age: WEEK_SECONDS, count: 250 },
      removeOnFail: { age: WEEK_SECONDS, count: 250 },
    },
    children,
  };

  const producer = createFlowProducer(restoreQueue.prefix);
  try {
    await producer.add(flow);
  } finally {
    await producer.close();
  }

  log(`Scheduled ${children.length} restore jobs.`);
  return { runId };
}
