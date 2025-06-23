import { getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";
import { mkDirRecursive } from "server/utils/mkDir";
import { execPromise } from "server/utils/execPromise";
import { join } from "node:path";
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
  } = {}
) {
  const [service] = await getDockerServices("nginx");
  if (!service) {
    throw new Error(
      "Nginx Proxy Manager service not found. Please ensure it is running."
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
