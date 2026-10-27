import {
  FissionEnvironment,
  FissionEnvironmentSpec,
  fissionGroup,
  fissionResourceNamespace,
  fissionVersion,
} from "server/routines/fission/types";
import { getK8sApi } from "server/routines/kubeSetup";

const plural = "environments";

export interface CreateEnvironmentOptions {
  /**
   * Environment name.
   */
  name: string;
  /**
   * Environment image URL.
   */
  image: string;
  /**
   * Size of the pool.
   */
  poolSize?: number;
  /**
   * Environment builder image URL.
   */
  builderImage?: string;
  /**
   * Build command for environment builder to build source package.
   */
  buildCommand?: string;
  /**
   * Minimum CPU in millicores.
   */
  minCpu?: number;
  /**
   * Maximum CPU in millicores.
   */
  maxCpu?: number;
  /**
   * Minimum memory in megabytes.
   */
  minMemory?: number;
  /**
   * Maximum memory in megabytes.
   */
  maxMemory?: number;
  /**
   * Grace time in seconds for pod draining before termination.
   */
  gracePeriod?: number;
  /**
   * Environment API version.
   */
  version?: number;
  /**
   * Secret for Kubernetes to pull image from a private registry.
   */
  imagePullSecret?: string;
  /**
   * Keep archive instead of extracting it into a directory.
   */
  keepArchive?: boolean;
  /**
   * Allow pod to access external network.
   */
  externalNetwork?: boolean;
  /**
   * Labels applied to environment metadata.
   */
  labels?: Record<string, string>;
  /**
   * Annotations applied to environment metadata.
   */
  annotations?: Record<string, string>;
  /**
   * Environment variables for builder container.
   */
  builderEnv?: Record<string, string>;
  /**
   * Environment variables for runtime container.
   */
  runtimeEnv?: Record<string, string>;
  /**
   * Namespace scope for this request.
   */
  namespace?: string;
}

/**
 * Creates a Fission Environment CRD.
 *
 * @param opts
 */
export async function createEnvironment(
  opts: CreateEnvironmentOptions,
): Promise<FissionEnvironment> {
  const { custom } = await getK8sApi();
  const namespace = opts.namespace ?? fissionResourceNamespace;

  const hasResourceRequest =
    opts.minCpu !== undefined || opts.minMemory !== undefined;
  const hasResourceLimit =
    opts.maxCpu !== undefined || opts.maxMemory !== undefined;

  const runtimeEnv = opts.runtimeEnv
    ? Object.entries(opts.runtimeEnv).map(([name, value]) => ({ name, value }))
    : undefined;

  const builderEnv = opts.builderEnv
    ? Object.entries(opts.builderEnv).map(([name, value]) => ({ name, value }))
    : undefined;

  const spec: FissionEnvironmentSpec = {
    version: opts.version ?? 3,
    runtime: {
      image: opts.image,
      container: runtimeEnv ? { env: runtimeEnv } : undefined,
    },
    builder:
      opts.builderImage || opts.buildCommand || builderEnv
        ? {
            image: opts.builderImage,
            command: opts.buildCommand,
            container: builderEnv ? { env: builderEnv } : undefined,
          }
        : undefined,
    resources:
      hasResourceRequest || hasResourceLimit
        ? {
            requests: hasResourceRequest
              ? {
                  cpu:
                    opts.minCpu !== undefined ? `${opts.minCpu}m` : undefined,
                  memory:
                    opts.minMemory !== undefined
                      ? `${opts.minMemory}Mi`
                      : undefined,
                }
              : undefined,
            limits: hasResourceLimit
              ? {
                  cpu:
                    opts.maxCpu !== undefined ? `${opts.maxCpu}m` : undefined,
                  memory:
                    opts.maxMemory !== undefined
                      ? `${opts.maxMemory}Mi`
                      : undefined,
                }
              : undefined,
          }
        : undefined,
    poolsize: opts.poolSize ?? 3,
    terminationGracePeriod: opts.gracePeriod,
    imagepullsecret: opts.imagePullSecret,
    keeparchive: opts.keepArchive,
    allowAccessToExternalNetwork: opts.externalNetwork,
  };

  const body: FissionEnvironment = {
    apiVersion: "fission.io/v1",
    kind: "Environment",
    metadata: {
      name: opts.name,
      namespace,
      labels: opts.labels,
      annotations: opts.annotations,
    },
    spec,
  };

  const res = await custom.createNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural,
    body,
  });

  return res as FissionEnvironment;
}

/**
 * Lists all Fission environments in the fission namespace.
 */
export async function listEnvironments(): Promise<FissionEnvironment[]> {
  const { custom } = await getK8sApi();

  const res = await custom.listNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace: fissionResourceNamespace,
    plural,
  });

  return (res as { items: FissionEnvironment[] }).items;
}

/**
 * Retrieves a single Fission environment by name.
 *
 * @param name
 */
export async function getEnvironment(
  name: string,
): Promise<FissionEnvironment | null> {
  const { custom } = await getK8sApi();

  try {
    const res = await custom.getNamespacedCustomObject({
      group: fissionGroup,
      version: fissionVersion,
      namespace: fissionResourceNamespace,
      plural,
      name,
    });

    return res as FissionEnvironment;
  } catch (err: any) {
    if (err.code === 404) {
      return null;
    }

    throw err;
  }
}
