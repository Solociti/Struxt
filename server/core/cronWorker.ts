import { setupWorker } from "server/database/setupQueue";
import { cronQueue } from "./cronQueue";
import { Job } from "bullmq";
import { backupMongodb } from "./backup/mongoDb";
import { backupDragonFly } from "./backup/dragonFly";
import { backupVictoriaMetrics } from "./backup/victoriaMetrics";
import { backupNginxProxyManager } from "./backup/nginxProxyManager";
import { backupGrafana } from "./backup/grafana";
import { syncS3Backups, syncS3Sites, syncS3Uploads } from "./backup/syncS3";

if (process.env.CONTAINER_NAME !== "core") {
  throw new Error("This script should only be run in the core container.");
}

setupWorker(
  cronQueue.prefix,
  cronQueue.name,
  async (job: Job) => {
    if (process.env.BACKUP_ENABLED !== "true") {
      console.warn("Backup is disabled, skipping job:", job.name);
      return;
    }

    switch (job.name) {
      case "backup-mongo-db":
        return await backupMongodb(job.data.dbName, {
          log: (message) => {
            job.log(message);
          },
          onProgress: (value, max) => {
            const percent = Math.round((value / max) * 100);

            job.updateProgress(percent);
          },
        });

      case "backup-nginx-proxy-manager":
        return await backupNginxProxyManager({
          log: (message) => {
            job.log(message);
          },
          onProgress: (value, max) => {
            const percent = Math.round((value / max) * 100);
            job.updateProgress(percent);
          },
        });

      case "backup-dragonfly":
        return await backupDragonFly({
          log: (message) => {
            job.log(message);
          },
          onProgress: (value, max) => {
            const percent = Math.round((value / max) * 100);
            job.updateProgress(percent);
          },
        });

      case "backup-victoriametrics":
        return await backupVictoriaMetrics({
          log: (message) => {
            job.log(message);
          },
          onProgress: (value, max) => {
            const percent = Math.round((value / max) * 100);
            job.updateProgress(percent);
          },
        });

      case "backup-grafana":
        return await backupGrafana({
          log: (message) => {
            job.log(message);
          },
          onProgress: (value, max) => {
            const percent = Math.round((value / max) * 100);
            job.updateProgress(percent);
          },
        });

      case "sync-sites-s3":
        return await syncS3Sites(
          (message) => {
            job.log(message);
          },
          (value, max) => {
            const percent = Math.round((value / max) * 100);
            job.updateProgress(percent);
          }
        );

      case "sync-uploads-s3":
        return await syncS3Uploads(
          (message) => {
            job.log(message);
          },
          (value, max) => {
            const percent = Math.round((value / max) * 100);
            job.updateProgress(percent);
          }
        );

      case "sync-backups-s3":
        return await syncS3Backups(
          (message) => {
            job.log(message);
          },
          (value, max) => {
            const percent = Math.round((value / max) * 100);
            job.updateProgress(percent);
          }
        );

      case "cleanup-local-backups":
        // TODO: Implement cleanup logic
        break;

      default:
        console.warn(`Unknown job name: ${job.name}`);
        break;
    }
  },
  {
    concurrency: 1,
  }
);
