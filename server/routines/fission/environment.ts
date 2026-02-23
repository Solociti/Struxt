import { getK8sApi } from "server/routines/kubeSetup";
import {
  FISSION_GROUP,
  FISSION_NAMESPACE,
  FISSION_VERSION,
  FissionEnvironment,
} from "server/routines/fission/types";

/**
 * Lists all Fission environments in the fission namespace.
 */
export async function listEnvironments(): Promise<FissionEnvironment[]> {
  const { custom } = await getK8sApi();

  const res = await custom.listNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace: FISSION_NAMESPACE,
    plural: "environments",
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
): Promise<FissionEnvironment> {
  const { custom } = await getK8sApi();

  const res = await custom.getNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace: FISSION_NAMESPACE,
    plural: "environments",
    name,
  });

  return res as FissionEnvironment;
}
