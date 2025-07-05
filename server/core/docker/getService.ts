import { hostname } from "node:os";
import { execPromise } from "server/utils/execPromise";
import { parseLabels } from "./parseLabels";

interface DockerService {
  ID: string;
  Command: string;
  CreatedAt: string;
  Image: string;
  Labels: Record<string, string>;
  LocalVolumes: string;
  Mounts: string;
  Names: string;
  Networks: string;
  Platform: string | null;
  Ports: string;
  RunningFor: string;
  Size: string;
  State: string;
  Status: string;
}

/**
 * Get the list of all Docker services.
 *
 * @returns
 */
export async function dockerPS(): Promise<DockerService[]> {
  const { stdout } = await execPromise(
    "docker ps --no-trunc -a --format '{{json .}}'"
  );
  if (!stdout) {
    return [];
  }

  const lines = stdout.trim().split("\n");

  const services = lines.map((line) => {
    const service = JSON.parse(line);
    service.Labels = parseLabels(service.Labels);

    return service as DockerService;
  });

  return services;
}

/**
 * Get a Docker service by its name.
 *
 * This will only find services part of this docker compose project.
 *
 * @param name
 * @returns
 */
export async function getDockerServices(name: string) {
  const services = await dockerPS();

  // find the base service by hostname
  const baseService = services.find((service) =>
    service.ID.startsWith(hostname())
  );
  if (!baseService) {
    return [];
  }

  // find the compose project name
  const projectName = baseService.Labels["com.docker.compose.project"] || "";
  if (!projectName) {
    return [];
  }

  return services.filter(
    (service) =>
      service.Labels["com.docker.compose.project"] === projectName &&
      service.Labels["com.docker.compose.service"] === name
  );
}

/**
 * Get a Docker service by its ID.
 *
 * @param id
 * @returns
 */
export async function getDockerServiceById(id: string) {
  const services = await dockerPS();

  return services.find((service) => service.ID === id);
}
