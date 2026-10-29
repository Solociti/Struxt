import { execPromise } from "server/utils/execPromise";
import { shellQuote } from "server/utils/shellQuote";
import { getDockerServices } from "./getService";
import { dockerInspectService } from "./inspectService";

/**
 * Replace the content of a service's volumes with the content of a tar.gz file.
 *
 * The service is stopped, each mount path is emptied, the archive is extracted
 * from a throwaway container using the service's own volumes and then the
 * service is started again. If anything fails the service stays stopped.
 *
 * @param serviceName compose service name
 * @param options
 * @param options.mountPaths container paths of the volumes to empty
 * @param options.tarFile archive path as seen by the core container
 * @param options.extractTo directory in the throwaway container to extract into
 * @param options.log
 */
export async function restoreServiceVolumes(
  serviceName: string,
  options: {
    mountPaths: string[];
    tarFile: string;
    extractTo: string;
    log?: (message: string) => void;
  },
) {
  const [service] = await getDockerServices(serviceName);
  if (!service) {
    throw new Error(`${serviceName} docker service not found.`);
  }

  const inspected = await dockerInspectService(service.ID);
  const binds = inspected.HostConfig.Binds || [];

  const volumeArgs = options.mountPaths.map((mountPath) => {
    const bind = binds.find((b) => b.split(":")[1] === mountPath);
    if (!bind) {
      throw new Error(`${serviceName} has no volume mounted at ${mountPath}`);
    }
    return `-v ${shellQuote(bind)}`;
  });

  const clean = options.mountPaths
    .map((mountPath) => `find ${shellQuote(mountPath)} -mindepth 1 -delete`)
    .join(" && ");
  const script = `${clean} && tar -xzf - -C ${shellQuote(options.extractTo)}`;

  options.log?.(`Stopping ${serviceName}`);
  await execPromise(`/usr/bin/docker stop ${service.ID}`);

  const command = `/usr/bin/docker run --rm -i --user 0:0 --entrypoint sh ${volumeArgs.join(
    " ",
  )} ${shellQuote(inspected.Image)} -c ${shellQuote(script)} < ${shellQuote(
    options.tarFile,
  )}`;
  options.log?.(command);
  await execPromise(command, { log: options.log });

  options.log?.(`Starting ${serviceName}`);
  await execPromise(`/usr/bin/docker start ${service.ID}`);
}
