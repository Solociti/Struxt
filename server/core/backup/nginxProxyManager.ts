import { join } from "node:path";
import { restoreServiceVolumes } from "server/core/docker/restoreServiceVolumes";
import { execPromise } from "server/utils/execPromise";
import { mkDirRecursive } from "server/utils/mkDir";
import { getBackupDir, getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";
import { backupFileResults } from "./fileResults";

/**
 * Backup the Nginx Proxy Manager configuration and data.
 *
 * @param options
 */
export async function backupNginxProxyManager(
  options: {
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {},
) {
  const [service] = await getDockerServices("nginx");
  if (!service) {
    throw new Error(
      "Nginx Proxy Manager service not found. Please ensure it is running.",
    );
  }
  const now = new Date();

  const backupDir = getCurrentBackupDir();
  await mkDirRecursive(backupDir);
  const backupFile = join(backupDir, `${now.getHours()}-nginx.tar.gz`);

  options.log?.(`Backup Dir: ${backupDir}`);
  options.onProgress?.(1, 10);

  // /etc/letsencrypt & /data
  const tarCommand = `docker exec ${service.ID} tar -czf ${backupFile} /etc/letsencrypt /data`;

  await execPromise(tarCommand, {
    log: options.log,
  });
  options.onProgress?.(10, 10);

  return await backupFileResults(backupFile);
}

/**
 * Restore the Nginx Proxy Manager configuration and certificates from a backup.
 *
 * @param date backup date directory. Example `5-3-2026`
 * @param hour
 * @param options
 */
export async function restoreNginxProxyManager(
  date: string,
  hour: number,
  options: { log?: (message: string) => void } = {},
) {
  await restoreServiceVolumes("nginx", {
    mountPaths: ["/data", "/etc/letsencrypt"],
    extractTo: "/",
    tarFile: join(getBackupDir(date), `${hour}-nginx.tar.gz`),
    log: options.log,
  });
  options.log?.("Nginx Proxy Manager restore completed successfully.");
}
