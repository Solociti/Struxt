import { join } from "node:path";
import { execPromise } from "server/utils/execPromise";
import { mkDirRecursive } from "server/utils/mkDir";
import { shellQuote } from "server/utils/shellQuote";
import { getBackupDir, getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";
import { dockerInspectService } from "../docker/inspectService";
import { backupFileResults } from "./fileResults";

/**
 * Backup victoria metrics data.
 *
 * @param options
 */
export async function backupVictoriaMetrics(
  options: {
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {},
) {
  const [service] = await getDockerServices("victoriametrics");
  if (!service) {
    throw new Error(
      "VictoriaMetrics service not found. Please ensure it is running.",
    );
  }
  const inspectedService = await dockerInspectService(service.ID);

  const hostname = service.Names;
  const network = `--network ${service.Networks}`;
  const volumes = inspectedService.HostConfig.Binds.map(
    (bind) => `-v ${bind}`,
  ).join(" ");

  const now = new Date();
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

  const backupFileName = `${now.getHours()}-victoria-metrics.tar.gz`;

  // Create a gzipped tarball of the backup directory, with the directory contents at the root of the tar
  const tarCommand = `tar -czf ../${backupFileName} *`;
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
  const backupFile = join(backupDir, `../${backupFileName}`);
  return await backupFileResults(backupFile);
}

/**
 * Restore the VictoriaMetrics data from a backup.
 *
 * The service is stopped while `vmrestore` replaces the storage data.
 *
 * @param date backup date directory. Example `5-3-2026`
 * @param hour
 * @param options
 */
export async function restoreVictoriaMetrics(
  date: string,
  hour: number,
  options: {
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {},
) {
  const [service] = await getDockerServices("victoriametrics");
  if (!service) {
    throw new Error(
      "VictoriaMetrics service not found. Please ensure it is running.",
    );
  }
  const inspectedService = await dockerInspectService(service.ID);

  const network = `--network ${service.Networks}`;
  const volumes = inspectedService.HostConfig.Binds.map(
    (bind) => `-v ${shellQuote(bind)}`,
  ).join(" ");

  const tarFile = join(getBackupDir(date), `${hour}-victoria-metrics.tar.gz`);
  const extractDir = join(
    getBackupDir(date),
    `victoria-metrics-restore-${hour}`,
  );
  await mkDirRecursive(extractDir);
  options.onProgress?.(1, 5);

  await execPromise(
    `tar -xzf ${shellQuote(tarFile)} -C ${shellQuote(extractDir)}`,
    { log: options.log },
  );
  options.onProgress?.(2, 5);

  options.log?.("Stopping VictoriaMetrics");
  await execPromise(`/usr/bin/docker stop ${service.ID}`);
  options.onProgress?.(3, 5);

  const image = "victoriametrics/vmrestore:latest";
  const vmRestoreCommand = `-src=fs://${extractDir} -storageDataPath=/victoria-metrics-data`;
  const dockerCommand = `/usr/bin/docker run --rm --user 0:0 ${network} ${volumes} ${image} ${vmRestoreCommand}`;
  options.log?.(dockerCommand);
  await execPromise(dockerCommand, { log: options.log });
  options.onProgress?.(4, 5);

  await execPromise(`rm -rf ${shellQuote(extractDir)}`);
  options.log?.("Starting VictoriaMetrics");
  await execPromise(`/usr/bin/docker start ${service.ID}`);
  options.onProgress?.(5, 5);

  options.log?.("VictoriaMetrics restore completed successfully.");
}
