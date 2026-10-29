import { execPromise } from "server/utils/execPromise";
import { getDockerServices } from "./getService";

/**
 * Stop all containers of the given compose services.
 *
 * @param names compose service names
 * @param log
 */
export async function stopDockerServices(
  names: string[],
  log?: (message: string) => void,
) {
  for (const name of names) {
    const services = await getDockerServices(name);

    for (const service of services) {
      log?.(`Stopping ${name} (${service.ID.slice(0, 12)})`);
      await execPromise(`/usr/bin/docker stop ${service.ID}`);
    }
  }
}

/**
 * Start all containers of the given compose services.
 *
 * @param names compose service names
 * @param log
 */
export async function startDockerServices(
  names: string[],
  log?: (message: string) => void,
) {
  for (const name of names) {
    const services = await getDockerServices(name);

    for (const service of services) {
      log?.(`Starting ${name} (${service.ID.slice(0, 12)})`);
      await execPromise(`/usr/bin/docker start ${service.ID}`);
    }
  }
}
