import { getK8sApi } from "server/routines/kubeSetup";
import {
  FISSION_GROUP,
  FISSION_RESOURCE_NAMESPACE,
  FISSION_VERSION,
  FissionTimeTrigger,
  FissionTimeTriggerSpec,
} from "server/routines/fission/types";

const PLURAL = "timetriggers";

/**
 * Options for creating a Fission TimeTrigger
 */
export interface CreateTimeTriggerOptions {
  name: string;
  cron: string;
  functionName: string;
  timezone?: string;
  namespace?: string;
}

/**
 * Create a Fission TimeTrigger for a cron schedule
 *
 * @param opts options for trigger creation
 */
export async function createTimeTrigger(
  opts: CreateTimeTriggerOptions,
): Promise<FissionTimeTrigger> {
  const { custom } = await getK8sApi();
  const namespace = opts.namespace ?? FISSION_RESOURCE_NAMESPACE;

  const spec: FissionTimeTriggerSpec = {
    cron: opts.cron,
    functionref: {
      type: "name",
      name: opts.functionName,
      functionweights: null,
    },
    ...(opts.timezone ? { timezone: opts.timezone } : {}),
  };

  const body: FissionTimeTrigger = {
    apiVersion: "fission.io/v1",
    kind: "TimeTrigger",
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

  return res as FissionTimeTrigger;
}

/**
 * Get a Fission TimeTrigger by name
 *
 * @param name trigger name
 * @param namespace resource namespace
 */
export async function getTimeTrigger(
  name: string,
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionTimeTrigger> {
  const { custom } = await getK8sApi();

  const res = await custom.getNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
    name,
  });

  return res as FissionTimeTrigger;
}

/**
 * List all Fission TimeTriggers in a namespace
 *
 * @param namespace resource namespace
 */
export async function listTimeTriggers(
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionTimeTrigger[]> {
  const { custom } = await getK8sApi();

  const res = await custom.listNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
  });

  return (res as { items: FissionTimeTrigger[] }).items;
}

/**
 * Update cron or timezone for a TimeTrigger
 *
 * @param name trigger name
 * @param patch partial spec patch
 * @param namespace resource namespace
 */
export async function updateTimeTrigger(
  name: string,
  patch: Partial<Pick<FissionTimeTriggerSpec, "cron">>,
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionTimeTrigger> {
  const { custom } = await getK8sApi();

  const existing = await getTimeTrigger(name, namespace);
  existing.spec = { ...existing.spec, ...patch };

  const res = await custom.replaceNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
    name,
    body: existing,
  });

  return res as FissionTimeTrigger;
}

/**
 * Delete a Fission TimeTrigger by name
 *
 * @param name trigger name
 * @param namespace resource namespace
 */
export async function deleteTimeTrigger(
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
