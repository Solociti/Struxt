import {
  fissionGroup,
  fissionResourceNamespace,
  FissionTimeTrigger,
  FissionTimeTriggerSpec,
  fissionVersion,
} from "server/routines/fission/types";
import { getK8sApi } from "server/routines/kubeSetup";

const plural = "timetriggers";

/**
 * Options for creating a Fission TimeTrigger
 */
export interface CreateTimeTriggerOptions {
  name: string;
  cron: string;
  functionName: string;
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
  const namespace = opts.namespace ?? fissionResourceNamespace;

  const spec: FissionTimeTriggerSpec = {
    cron: opts.cron,
    functionref: {
      type: "name",
      name: opts.functionName,
      functionweights: null,
    },
  };

  const body: FissionTimeTrigger = {
    apiVersion: "fission.io/v1",
    kind: "TimeTrigger",
    metadata: { name: opts.name, namespace },
    spec,
  };

  const res = await custom.createNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural: plural,
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
  namespace = fissionResourceNamespace,
): Promise<FissionTimeTrigger> {
  const { custom } = await getK8sApi();

  const res = await custom.getNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural: plural,
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
  namespace = fissionResourceNamespace,
): Promise<FissionTimeTrigger[]> {
  const { custom } = await getK8sApi();

  const res = await custom.listNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural: plural,
  });

  return (res as { items: FissionTimeTrigger[] }).items;
}

/**
 * Update cron for a TimeTrigger
 *
 * @param name trigger name
 * @param patch partial spec patch
 * @param namespace resource namespace
 */
export async function updateTimeTrigger(
  name: string,
  patch: Partial<Pick<FissionTimeTriggerSpec, "cron">>,
  namespace = fissionResourceNamespace,
): Promise<FissionTimeTrigger> {
  const { custom } = await getK8sApi();

  const existing = await getTimeTrigger(name, namespace);
  existing.spec = { ...existing.spec, ...patch };

  const res = await custom.replaceNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural: plural,
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
  namespace = fissionResourceNamespace,
): Promise<void> {
  const { custom } = await getK8sApi();

  await custom.deleteNamespacedCustomObject({
    group: fissionGroup,
    version: fissionVersion,
    namespace,
    plural: plural,
    name,
  });
}
