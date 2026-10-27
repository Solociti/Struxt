import {
  FissionFunction,
  FissionFunctionSpec,
  fissionGroup,
  fissionResourceNamespace,
  fissionVersion,
} from "server/routines/fission/types";
import { getK8sApi } from "server/routines/kubeSetup";

const plural = "functions";

export interface CreateFunctionOptions {
  /**
   * Function name.
   */
  name: string;
  /**
   * Environment name for function.
   */
  environmentName: string;
  /**
   * Name of the existing package in the same namespace.
   */
  packageName: string;
  /**
   * Entry point for environment v2 to load with.
   */
  functionName: string;
  /**
   * Executor type for execution.
   */
  executorType?: "poolmgr" | "newdeploy" | "container";
  /**
   * Function access to configmaps in the same namespace.
   */
  configMaps?: string[];
  /**
   * Function access to secrets in the same namespace.
   */
  secrets?: string[];
  /**
   * Timeout for executor to wait for function pod creation.
   */
  specializationTimeout?: number;
  /**
   * Maximum time for a request to wait for a response from the function.
   */
  functionTimeout?: number;
  /**
   * Length of time in seconds before idle function pods are eligible for recycling.
   */
  idleTimeout?: number;
  /**
   * Maximum number of pods specialized concurrently to serve requests.
   */
  concurrency?: number;
  /**
   * Maximum number of concurrent requests served by a specialized pod.
   */
  requestsPerPod?: number;
  /**
   * Whether a specialized pod serves exactly one request in its lifetime.
   */
  onceOnly?: boolean;
  /**
   * Number of specialized pods to retain after serving requests.
   */
  retainPods?: number;
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
   * Minimum number of pods for autoscaling.
   */
  minScale?: number;
  /**
   * Maximum number of pods for autoscaling.
   */
  maxScale?: number;
  /**
   * Target average CPU usage percentage across pods for scaling.
   */
  targetCpuPercent?: number;
  /**
   * Labels translated into metadata labels.
   */
  labels?: Record<string, string>;
  /**
   * Annotations translated into metadata annotations.
   */
  annotations?: Record<string, string>;
  /**
   * Namespace scope for this request.
   */
  namespace?: string;
}

/**
 * Creates a Fission Function CRD that references a package and handler.
 *
 * @param opts
 */
export async function createFunction(
  opts: CreateFunctionOptions,
): Promise<FissionFunction> {
  const { custom } = await getK8sApi();
  const namespace = opts.namespace ?? fissionResourceNamespace;

  const hasResourceRequest =
    opts.minCpu !== undefined || opts.minMemory !== undefined;
  const hasResourceLimit =
    opts.maxCpu !== undefined || opts.maxMemory !== undefined;

  const resources: FissionFunctionSpec["resources"] | undefined =
    hasResourceRequest || hasResourceLimit
      ? {
          requests: hasResourceRequest
            ? {
                cpu: opts.minCpu !== undefined ? `${opts.minCpu}m` : undefined,
                memory:
                  opts.minMemory !== undefined
                    ? `${opts.minMemory}Mi`
                    : undefined,
              }
            : undefined,
          limits: hasResourceLimit
            ? {
                cpu: opts.maxCpu !== undefined ? `${opts.maxCpu}m` : undefined,
                memory:
                  opts.maxMemory !== undefined
                    ? `${opts.maxMemory}Mi`
                    : undefined,
              }
            : undefined,
        }
      : undefined;

  const spec: FissionFunctionSpec = {
    environment: { name: opts.environmentName, namespace },
    package: {
      packageref: {
        name: opts.packageName,
        namespace,
      },
      functionName: opts.functionName,
    },
    InvokeStrategy: {
      StrategyType: "execution",
      ExecutionStrategy: {
        ExecutorType: opts.executorType ?? "poolmgr",
        MinScale: opts.minScale,
        MaxScale: opts.maxScale,
        TargetCPUPercent: opts.targetCpuPercent,
        SpecializationTimeout: opts.specializationTimeout,
      },
    },
    resources,
    secrets: opts.secrets?.map((name) => ({ name, namespace })),
    configmaps: opts.configMaps?.map((name) => ({ name, namespace })),
    functionTimeout: opts.functionTimeout,
    idletimeout: opts.idleTimeout,
    concurrency: opts.concurrency,
    requestsPerPod: opts.requestsPerPod,
    onceOnly: opts.onceOnly,
    retainPods: opts.retainPods,
  };

  const body: FissionFunction = {
    apiVersion: "fission.io/v1",
    kind: "Function",
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

  return res as FissionFunction;
}

/**
 * Retrieves a Fission Function by name.
 *
 * @param name
 * @param namespace
 */
export async function getFunction(
  name: string,
  namespace = fissionResourceNamespace,
): Promise<FissionFunction> {
  const { custom } = await getK8sApi();

  const res = await custom.getNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural,
    name,
  });

  return res as FissionFunction;
}

/**
 * Lists all Fission Functions in the given namespace.
 *
 * @param namespace
 */
export async function listFunctions(
  namespace = fissionResourceNamespace,
): Promise<FissionFunction[]> {
  const { custom } = await getK8sApi();

  const res = await custom.listNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural,
  });

  return (res as { items: FissionFunction[] }).items;
}

/**
 * Deletes a Fission Function by name.
 *
 * @param name
 * @param namespace
 */
export async function deleteFunction(
  name: string,
  namespace = fissionResourceNamespace,
): Promise<void> {
  const { custom } = await getK8sApi();

  await custom.deleteNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural,
    name,
  });
}
