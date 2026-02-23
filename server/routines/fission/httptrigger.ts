import { getK8sApi } from "server/routines/kubeSetup";
import {
  FISSION_GROUP,
  FISSION_RESOURCE_NAMESPACE,
  FISSION_VERSION,
  FissionHttpTrigger,
  FissionHttpTriggerSpec,
} from "server/routines/fission/types";

const PLURAL = "httptriggers";

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
  const namespace = opts.namespace ?? FISSION_RESOURCE_NAMESPACE;

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
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
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
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionHttpTrigger> {
  const { custom } = await getK8sApi();

  const res = await custom.getNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
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
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionHttpTrigger[]> {
  const { custom } = await getK8sApi();

  const res = await custom.listNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
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
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionHttpTrigger> {
  const { custom } = await getK8sApi();

  const existing = await getHttpTrigger(name, namespace);
  existing.spec = { ...existing.spec, ...patch };

  const res = await custom.replaceNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
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
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<void> {
  const { custom } = await getK8sApi();

  await custom.deleteNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
    name,
  });
}
