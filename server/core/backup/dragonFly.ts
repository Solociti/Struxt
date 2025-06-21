import { setupNewClient } from "server/database/dragonFly";
import { execPromise } from "server/utils/execPromise";
import { getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";
import { mkDirRecursive } from "server/utils/mkDir";

/**
 * Backup DragonFly data.
 *
 * @param options
 */
export async function backupDragonFly(
  options: {
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {}
): Promise<void> {
  const [dragonflyService] = await getDockerServices("dragonfly");
  if (!dragonflyService) {
    throw new Error("DragonFly docker service not found.");
  }

  // flush all changes to disk
  const client = await setupNewClient();
  await client.save();

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
}
