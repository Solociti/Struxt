import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { cronQueue } from "../cronQueue";
import { localOnly } from "../isLocalRequest";
import {
  defaultRestoreComponents,
  RestoreComponent,
  restoreComponents,
} from "./backupFileNames";
import { findRestorePoint, listRestorePoints } from "./restorePoints";
import { hasActiveRestore } from "./restoreQueue";
import { getRestoreStatus } from "./restoreStatus";
import { getBackupStatus, scheduleBackup } from "./scheduleBackup";
import { scheduleRestore } from "./scheduleRestore";

/**
 * Wrap an async route handler so errors are returned as a 500 response.
 *
 * @param handler
 * @returns
 */
function route(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch((error: unknown) => {
      console.error(error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });
  };
}

/**
 * Reject restore requests unless restoring is enabled in the environment.
 *
 * @param req
 * @param res
 * @param next
 */
function restoreEnabled(req: Request, res: Response, next: NextFunction) {
  if (process.env.RESTORE_ENABLED !== "true") {
    res
      .status(403)
      .json({ error: "Restore is disabled. Set RESTORE_ENABLED=true." });
    return;
  }

  next();
}

/**
 * Routes to manually start and monitor backups and restores.
 *
 * Only local, non-proxied requests are accepted.
 */
export function createBackupRestoreTriggerRouter() {
  const router = express.Router();
  router.use(localOnly);
  router.use(express.json({ limit: "10kb" }));

  router.post(
    "/backup",
    route(async (req, res) => {
      if (process.env.BACKUP_ENABLED !== "true") {
        res.status(409).json({ error: "Backup is disabled." });
        return;
      }

      if (await cronQueue.queue.isPaused()) {
        res.status(409).json({
          error: "The cron queue is paused by a running or failed restore.",
        });
        return;
      }

      res.status(202).json({ ids: await scheduleBackup() });
    }),
  );

  router.get(
    "/backup/status",
    route(async (req, res) => {
      const ids = String(req.query.ids || "")
        .split(",")
        .filter((id) => /^[\w:-]+$/.test(id));

      res.json(await getBackupStatus(ids));
    }),
  );

  router.get(
    "/restore/points",
    restoreEnabled,
    route(async (req, res) => {
      res.json(await listRestorePoints());
    }),
  );

  router.post(
    "/restore",
    restoreEnabled,
    route(async (req, res) => {
      const { id, components, includeSessions, dryRun } = req.body || {};

      const point = await findRestorePoint(id);
      if (!point) {
        res.status(404).json({ error: "Restore point not found." });
        return;
      }

      const selected: RestoreComponent[] =
        components ?? defaultRestoreComponents;
      if (
        !Array.isArray(selected) ||
        selected.some((c) => !restoreComponents.includes(c))
      ) {
        res.status(400).json({
          error: `components must be a list of: ${restoreComponents.join(
            ", ",
          )}`,
        });
        return;
      }

      const available = selected.filter((c) => point.components.includes(c));

      if (await hasActiveRestore()) {
        res.status(409).json({ error: "A restore is already running." });
        return;
      }

      const runId = await scheduleRestore({
        pointId: point.id,
        components: available,
        includeSessions: includeSessions === true,
        dryRun: dryRun === true,
      });

      res.status(202).json({ runId, components: available });
    }),
  );

  router.get(
    "/restore/:runId/status",
    restoreEnabled,
    route(async (req, res) => {
      const runId = String(req.params.runId);
      if (!/^[\w:-]+$/.test(runId)) {
        res.status(400).json({ error: "Invalid run id." });
        return;
      }

      res.json(await getRestoreStatus(runId));
    }),
  );

  return router;
}
