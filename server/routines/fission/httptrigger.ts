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
  /** Unique name for the trigger CRD resource. */
  name: string;
  /** Relative URL path the trigger responds to (e.g. `/api/my-route`). */
  relativeUrl: string;
  /** HTTP methods to match (e.g. `["GET", "POST"]`). */
  methods: string[];
  /** Name of the Fission Function to invoke. */
  functionName: string;
  /** Namespace to create the trigger in (defaults to FISSION_RESOURCE_NAMESPACE). */
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

  const spec: FissionHttpTriggerSpec = {
    relativeurl: opts.relativeUrl,
    methods: opts.methods,
    functionref: {
      type: "name",
      name: opts.functionName,
      functionweights: null,
    },
    createingress: false,
    ingressconfig: {},
  };

  const body: FissionHttpTrigger = {
    apiVersion: "fission.io/v1",
    kind: "HTTPTrigger",
    metadata: { name: opts.name, namespace },
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
