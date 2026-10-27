import * as k8s from "@kubernetes/client-node";
import { fissionResourceNamespace } from "server/routines/fission/types";
import { getK8sApi } from "server/routines/kubeSetup";
import { isStatusCode } from "./utils";

export interface UpsertSecretOptions {
  /**
   * Secret name.
   */
  name: string;
  /**
   * Secret key/value data.
   */
  stringData: Record<string, string>;
  /**
   * Labels applied to metadata.
   */
  labels?: Record<string, string>;
  /**
   * Annotations applied to metadata.
   */
  annotations?: Record<string, string>;
  /**
   * Marks Secret immutable.
   */
  immutable?: boolean;
  /**
   * Namespace scope for this request.
   */
  namespace?: string;
}

/**
 * Creates or replaces a namespaced Opaque Secret.
 *
 * @param opts
 */
export async function upsertSecret(
  opts: UpsertSecretOptions,
): Promise<k8s.V1Secret> {
  const { core } = await getK8sApi();
  const namespace = opts.namespace ?? fissionResourceNamespace;

  const body: k8s.V1Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: opts.name,
      namespace,
      labels: opts.labels,
      annotations: opts.annotations,
    },
    type: "Opaque",
    stringData: opts.stringData,
    immutable: opts.immutable,
  };

  try {
    const res = await core.createNamespacedSecret({ namespace, body });
    return res as k8s.V1Secret;
  } catch (err) {
    if (!isStatusCode(err, 409)) {
      throw err;
    }
  }

  const res = await core.replaceNamespacedSecret({
    name: opts.name,
    namespace,
    body,
  });

  return res as k8s.V1Secret;
}

/**
 * Deletes a namespaced Secret.
 *
 * @param name
 * @param namespace
 * @param ignoreNotFound
 */
export async function deleteSecret(
  name: string,
  namespace = fissionResourceNamespace,
  ignoreNotFound = true,
): Promise<void> {
  const { core } = await getK8sApi();

  try {
    await core.deleteNamespacedSecret({ name, namespace });
  } catch (err) {
    if (ignoreNotFound && isStatusCode(err, 404)) {
      return;
    }

    throw err;
  }
}
