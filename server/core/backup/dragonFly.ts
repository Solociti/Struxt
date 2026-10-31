import { restoreServiceVolumes } from "server/core/docker/restoreServiceVolumes";
import { setupNewClient } from "server/database/dragonFly";
import { execPromise } from "server/utils/execPromise";
import { mkDirRecursive } from "server/utils/mkDir";
import { getBackupDir, getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";
import { backupFileResults } from "./fileResults";

/**
 * Backup DragonFly data.
 *
 * @param options
 */
export async function backupDragonFly(
  options: {
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {},
) {
  const [dragonflyService] = await getDockerServices("dragonfly");
  if (!dragonflyService) {
    throw new Error("DragonFly docker service not found.");
  }

  // flush all changes to disk
  const client = await setupNewClient();
  await client.sendCommand(["SAVE"]);

  options.onProgress?.(25, 100);

  await client.quit();

  // copy the data directory to the backup location
  const now = new Date();
  const backupDir = getCurrentBackupDir();
  await mkDirRecursive(backupDir);
  const backupPath = `${backupDir}/${now.getHours()}.dragonfly.tar.gz`;

  // const command = `/usr/bin/docker exec -i ${dragonflyService.ID} tar -c -z -f ${backupPath} /data`;
  const command = `/usr/bin/docker exec ${dragonflyService.ID} sh -c "cd /data && tar -czf - *" > ${backupPath}`;

  options.log?.(command);

  await execPromise(command, {
    log: options.log,
  });
  options.onProgress?.(100, 100);
  options.log?.("DragonFly backup completed successfully.");

  return await backupFileResults(backupPath);
}

/**
 * Restore the DragonFly data directory from a backup.
 *
 * This replaces the queues and caches, including the restore job itself.
 * The data is only replaced after DragonFly is stopped.
 *
 * @param date backup date directory. Example `5-3-2026`
 * @param hour
 * @param options
 */
export async function restoreDragonFly(
  date: string,
  hour: number,
  options: { log?: (message: string) => void } = {},
) {
  await restoreServiceVolumes("dragonfly", {
    mountPaths: ["/data"],
    extractTo: "/data",
    tarFile: `${getBackupDir(date)}/${hour}.dragonfly.tar.gz`,
    log: options.log,
  });
  options.log?.("DragonFly restore completed successfully.");
}
