import {
  fissionGroup,
  FissionHttpTrigger,
  FissionHttpTriggerSpec,
  fissionResourceNamespace,
  fissionVersion,
} from "server/routines/fission/types";
import { getK8sApi } from "server/routines/kubeSetup";

const plural = "httptriggers";

export interface CreateHttpTriggerOptions {
  /**
   * HTTP trigger name.
   */
  name: string;
  /**
   * URL pattern exposed by the trigger.
   */
  relativeUrl: string;
  /**
   * HTTP methods for the trigger.
   */
  methods?: string[];
  /**
   * Name of the function for direct routing.
   */
  functionName?: string;
  /**
   * Function name to weight map for canary routing.
   */
  functionWeights?: Record<string, number>;
  /**
   * Create an ingress alongside the trigger.
   */
  createIngress?: boolean;
  /**
   * Deprecated host field in HTTPTrigger spec.
   */
  host?: string;
  /**
   * Ingress host/path/tls and annotations.
   */
  ingressConfig?: FissionHttpTriggerSpec["ingressconfig"];
  /**
   * Prefix with which functions are exposed.
   */
  prefix?: string;
  /**
   * Keep prefix while forwarding request to function.
   */
  keepPrefix?: boolean;
  /**
   * Labels applied to HTTP trigger metadata.
   */
  labels?: Record<string, string>;
  /**
   * Namespace scope for this request.
   */
  namespace?: string;
}

/**
 * Creates a Fission HTTPTrigger that routes HTTP requests to a function.
 *
 * @param opts
 */
export async function createHttpTrigger(
  opts: CreateHttpTriggerOptions,
): Promise<FissionHttpTrigger> {
  const { custom } = await getK8sApi();
  const namespace = opts.namespace ?? fissionResourceNamespace;

  const hasWeights = opts.functionWeights !== undefined;
  const functionref = hasWeights
    ? {
        type: "function-weights" as const,
        functionweights: opts.functionWeights ?? null,
      }
    : {
        type: "name" as const,
        name: opts.functionName,
        functionweights: null,
      };

  const spec: FissionHttpTriggerSpec = {
    relativeurl: opts.relativeUrl,
    methods: opts.methods ?? ["GET"],
    functionref,
    createingress: opts.createIngress ?? false,
    host: opts.host,
    ingressconfig: opts.ingressConfig,
    prefix: opts.prefix,
    keepPrefix: opts.keepPrefix,
  };

  const body: FissionHttpTrigger = {
    apiVersion: "fission.io/v1",
    kind: "HTTPTrigger",
    metadata: { name: opts.name, namespace, labels: opts.labels },
    spec,
  };

  const res = await custom.createNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural,
    body,
  });

  return res as FissionHttpTrigger;
}

/**
 * Retrieves a Fission HTTPTrigger by name.
 *
 * @param name
 * @param namespace
 */
export async function getHttpTrigger(
  name: string,
  namespace = fissionResourceNamespace,
): Promise<FissionHttpTrigger> {
  const { custom } = await getK8sApi();

  const res = await custom.getNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural,
    name,
  });

  return res as FissionHttpTrigger;
}

/**
 * Lists all Fission HTTPTriggers in the given namespace.
 *
 * @param namespace
 */
export async function listHttpTriggers(
  namespace = fissionResourceNamespace,
): Promise<FissionHttpTrigger[]> {
  const { custom } = await getK8sApi();

  const res = await custom.listNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural,
  });

  return (res as { items: FissionHttpTrigger[] }).items;
}

/**
 * Updates the relative URL and/or methods on an existing HTTPTrigger.
 *
 * @param name
 * @param patch
 * @param namespace
 */
export async function updateHttpTrigger(
  name: string,
  patch: Partial<Pick<FissionHttpTriggerSpec, "relativeurl" | "methods">>,
  namespace = fissionResourceNamespace,
): Promise<FissionHttpTrigger> {
  const { custom } = await getK8sApi();

  const existing = await getHttpTrigger(name, namespace);
  existing.spec = { ...existing.spec, ...patch };

  const res = await custom.replaceNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural,
    name,
    body: existing,
  });

  return res as FissionHttpTrigger;
}

/**
 * Deletes a Fission HTTPTrigger by name.
 *
 * @param name
 * @param namespace
 */
export async function deleteHttpTrigger(
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
