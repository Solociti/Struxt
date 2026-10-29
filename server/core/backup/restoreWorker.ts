import { Job } from "bullmq";
import { startDockerServices } from "server/core/docker/controlService";
import { setupWorker } from "server/database/setupQueue";
import { restoreDragonFly } from "./dragonFly";
import { restoreGrafana } from "./grafana";
import { restoreMongodb } from "./mongoDb";
import { restoreNginxProxyManager } from "./nginxProxyManager";
import {
  RestoreJobData,
  restoreQueue,
  restoreStoppedServices,
  resumeCronQueue,
} from "./restoreQueue";
import { runRestoreKickoff } from "./scheduleRestore";
import { restoreS3Sites, restoreS3Uploads } from "./syncS3";
import { restoreVictoriaMetrics } from "./victoriaMetrics";

if (process.env.CONTAINER_NAME !== "core") {
  throw new Error("This script should only be run in the core container.");
}

/**
 * Process a restore job.
 *
 * @param job
 */
async function processRestoreJob(job: Job) {
  const log = (message: string) => {
    job.log(message);
  };
  const onProgress = (value: number, max: number) => {
    job.updateProgress(Math.round((value / max) * 100));
  };
  const data = job.data as RestoreJobData;

  switch (job.name) {
    case "restore-kickoff":
      return await runRestoreKickoff(job);

    case "restore-mongo-db":
      return await restoreMongodb(data.date, data.hour, {
        includeSessions: data.includeSessions,
        log,
        onProgress,
      });

    case "restore-victoriametrics":
      return await restoreVictoriaMetrics(data.date, data.hour, {
        log,
        onProgress,
      });

    case "restore-grafana":
      return await restoreGrafana(data.date, data.hour, { log });

    case "restore-nginx":
      return await restoreNginxProxyManager(data.date, data.hour, { log });

    case "restore-s3-uploads":
      return await restoreS3Uploads(log, onProgress);

    case "restore-s3-sites":
      return await restoreS3Sites(log, onProgress);

    case "restore-finish":
      if (data.startDragonFly) {
        await restoreDragonFly(data.date, data.hour, { log });
      }
      await startDockerServices(restoreStoppedServices, log);
      await resumeCronQueue(log);
      return;

    default:
      console.warn(`Unknown restore job name: ${job.name}`);
      break;
  }
}

setupWorker(restoreQueue.prefix, restoreQueue.name, processRestoreJob, {
  concurrency: 3,
});
