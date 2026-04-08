import * as k8s from "@kubernetes/client-node";
import { fissionResourceNamespace } from "server/routines/fission/types";
import { getK8sApi } from "server/routines/kubeSetup";
import { isStatusCode } from "server/routines/k8s/utils";

export interface UpsertConfigMapOptions {
  /**
   * ConfigMap name.
   */
  name: string;
  /**
   * ConfigMap key/value data.
   */
  data: Record<string, string>;
  /**
   * Labels applied to metadata.
   */
  labels?: Record<string, string>;
  /**
   * Annotations applied to metadata.
   */
  annotations?: Record<string, string>;
  /**
   * Marks ConfigMap immutable.
   */
  immutable?: boolean;
  /**
   * Namespace scope for this request.
   */
  namespace?: string;
}

/**
 * Creates or replaces a namespaced ConfigMap.
 *
 * @param opts
 */
export async function upsertConfigMap(
  opts: UpsertConfigMapOptions,
): Promise<k8s.V1ConfigMap> {
  const { core } = await getK8sApi();
  const namespace = opts.namespace ?? fissionResourceNamespace;

  const body: k8s.V1ConfigMap = {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: {
      name: opts.name,
      namespace,
      labels: opts.labels,
      annotations: opts.annotations,
    },
    data: opts.data,
    immutable: opts.immutable,
  };

  try {
    const res = await core.createNamespacedConfigMap({ namespace, body });
    return res as k8s.V1ConfigMap;
  } catch (err) {
    if (!isStatusCode(err, 409)) {
      throw err;
    }
  }

  const res = await core.replaceNamespacedConfigMap({
    name: opts.name,
    namespace,
    body,
  });

  return res as k8s.V1ConfigMap;
}

/**
 * Deletes a namespaced ConfigMap.
 *
 * @param name
 * @param namespace
 * @param ignoreNotFound
 */
export async function deleteConfigMap(
  name: string,
  namespace = fissionResourceNamespace,
  ignoreNotFound = true,
): Promise<void> {
  const { core } = await getK8sApi();

  try {
    await core.deleteNamespacedConfigMap({ name, namespace });
  } catch (err) {
    if (ignoreNotFound && isStatusCode(err, 404)) {
      return;
    }

    throw err;
  }
}
