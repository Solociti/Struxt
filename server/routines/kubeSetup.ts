import * as k8s from "@kubernetes/client-node";
import { env } from "node:process";

const kubeConfigPath =
  env.IS_DOCKER === "true"
    ? "/secrets/kubeconfig"
    : env.FISSION_KUBECONFIG_PATH;

export interface K8sApi {
  core: k8s.CoreV1Api;
  custom: k8s.CustomObjectsApi;
  kc: k8s.KubeConfig;
}

let api: K8sApi | null = null;

/**
 * Returns a lazily-initialised Kubernetes API client set.
 * Loads the kubeconfig from the environment or uses in-cluster config.
 */
export async function getK8sApi(): Promise<K8sApi> {
  if (api) {
    return api;
  }

  const kc = new k8s.KubeConfig();

  if (!kubeConfigPath) {
    throw new Error(
      "Kubeconfig path is not set. Please set FISSION_KUBECONFIG_PATH environment variable.",
    );
  }
  kc.loadFromFile(kubeConfigPath);

  api = {
    core: kc.makeApiClient(k8s.CoreV1Api),
    custom: kc.makeApiClient(k8s.CustomObjectsApi),
    kc,
  };

  return api;
}
