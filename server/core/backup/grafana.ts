import { restoreServiceVolumes } from "server/core/docker/restoreServiceVolumes";
import { execPromise } from "server/utils/execPromise";
import { mkDirRecursive } from "server/utils/mkDir";
import { getBackupDir, getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";
import { backupFileResults } from "./fileResults";

export async function backupGrafana(
  options: {
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {},
) {
  const [grafanaService] = await getDockerServices("grafana");
  if (!grafanaService) {
    throw new Error("Grafana docker service not found.");
  }

  const now = new Date();
  const backupDir = getCurrentBackupDir();
  await mkDirRecursive(backupDir);
  const backupPath = `${backupDir}/${now.getHours()}-grafana.tar.gz`;

  options.onProgress?.(25, 100);

  // Create a tarball of the Grafana data directory
  const command = `/usr/bin/docker exec ${grafanaService.ID} sh -c "cd /var/lib/grafana && tar -czf - *" > ${backupPath}`;

  options.log?.(command);

  await execPromise(command, {
    log: options.log,
  });

  options.onProgress?.(100, 100);
  options.log?.("Grafana backup completed successfully.");

  return await backupFileResults(backupPath);
}

/**
 * Restore the Grafana data directory from a backup.
 *
 * @param date backup date directory. Example `5-3-2026`
 * @param hour
 * @param options
 */
export async function restoreGrafana(
  date: string,
  hour: number,
  options: { log?: (message: string) => void } = {},
) {
  await restoreServiceVolumes("grafana", {
    mountPaths: ["/var/lib/grafana"],
    extractTo: "/var/lib/grafana",
    tarFile: `${getBackupDir(date)}/${hour}-grafana.tar.gz`,
    log: options.log,
  });
  options.log?.("Grafana restore completed successfully.");
}
