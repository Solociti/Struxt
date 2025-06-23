import { join } from "node:path";
import { execPromise } from "server/utils/execPromise";
import { mkDirRecursive } from "server/utils/mkDir";
import { getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";
import { dockerInspectService } from "../docker/inspectService";

/**
 * Backup victoria metrics data.
 *
 * @param options
 */
export async function backupVictoriaMetrics(
  options: {
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {}
) {
  const [service] = await getDockerServices("victoriametrics");
  if (!service) {
    throw new Error(
      "VictoriaMetrics service not found. Please ensure it is running."
    );
  }
  const inspectedService = await dockerInspectService(service.ID);

  const hostname = service.Names;
  const network = `--network ${service.Networks}`;
  const volumes = inspectedService.HostConfig.Binds.map(
    (bind) => `-v ${bind}`
  ).join(" ");

  // the backup directory inside the containers
  const backupDir = join(getCurrentBackupDir(), "victoria-metrics");
  await mkDirRecursive(backupDir);
  options.log?.(`Created backup directory: ${backupDir}`);
  options.onProgress?.(1, 4);

  const vmBackupCommand = `-storageDataPath=/victoria-metrics-data -snapshot.createURL=http://${hostname}:8428/snapshot/create -dst=fs://${backupDir}`;

  // victoriametrics/vmbackup is the docker image used to create a backup
  const image = "victoriametrics/vmbackup:latest";
  const dockerCommand = `docker run --rm --user 1000:1000 ${network} ${volumes} ${image} ${vmBackupCommand}`;

  await execPromise(dockerCommand, {
    log: options.log,
  });
  options.onProgress?.(2, 4);

  // Create a gzipped tarball of the backup directory, with the directory contents at the root of the tar
  const tarCommand = `tar -czf ../victoria-metrics.gz *`;
  await execPromise(tarCommand, {
    cwd: backupDir,
    log: options.log,
  });
  options.onProgress?.(3, 4);

  // delete the backup directory after creating the tarball
  const deleteCommand = `rm -rf "${backupDir}"`;
  await execPromise(deleteCommand, {
    log: options.log,
  });
  options.onProgress?.(4, 4);

  // Optionally, you could return the path to the tarball
  return join(backupDir, "../victoria-metrics.gz");
}
