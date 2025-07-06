import { Job } from "bullmq";
import { setupWorker } from "server/database/setupQueue";
import { cleanLocalBackups } from "./backup/cleanLocalBackups";
import { backupDragonFly } from "./backup/dragonFly";
import { backupGrafana } from "./backup/grafana";
import { backupMongodb } from "./backup/mongoDb";
import { backupNginxProxyManager } from "./backup/nginxProxyManager";
import { syncS3Backups, syncS3Sites, syncS3Uploads } from "./backup/syncS3";
import { backupVictoriaMetrics } from "./backup/victoriaMetrics";
import { cronQueue } from "./cronQueue";
import { downloadPasswordLists } from "server/auth/downloadPasswordLists";
import { updateGeoIP } from "server/utils/geoLocation";

if (process.env.CONTAINER_NAME !== "core") {
  throw new Error("This script should only be run in the core container.");
}

setupWorker(
  cronQueue.prefix,
  cronQueue.name,
  async (job: Job) => {
    switch (job.name) {
      case "downloadPasswordLists": {
        await downloadPasswordLists(job);
        break;
      }

      case "update-geoip":
        return await updateGeoIP(job);

      case "backup-mongo-db":
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

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
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

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
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

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
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

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
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

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
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

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
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

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
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

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
        if (process.env.BACKUP_ENABLED !== "true") {
          console.warn("Backup is disabled, skipping job:", job.name);
          return;
        }

        return await cleanLocalBackups((msg: string) => job.log(msg));

      default:
        console.warn(`Unknown job name: ${job.name}`);
        break;
    }
  },
  {
    concurrency: 1,
  }
);
