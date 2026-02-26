import type * as k8s from "@kubernetes/client-node";
import FormData from "form-data";
import fetch, { RequestInit } from "node-fetch";
import { RequestOptions } from "node:https";
import { Readable } from "node:stream";
import { getK8sApi } from "server/routines/kubeSetup";

/**
 * Extracts fetch options (including auth headers and agent) from the kubeconfig.
 *
 * @param kc
 */
async function resolveFetchOptions(kc: k8s.KubeConfig): Promise<RequestInit> {
  const opts: RequestOptions = {};
  const init = await kc.applyToFetchOptions(opts);
  return init as RequestInit;
}

const storagesvcProxyPath =
  "/api/v1/namespaces/fission/services/http:storagesvc:80/proxy";

/**
 * Builds the K8s API proxy URL for a storagesvc path.
 *
 * @param clusterServer
 * @param path e.g. `/v1/archive`
 * @param params
 */
function storageSvcUrl(
  clusterServer: string,
  path: string,
  params?: Record<string, string>,
): string {
  const url = new URL(`${storagesvcProxyPath}${path}`, clusterServer);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

export interface UploadedArchive {
  /** Opaque ID returned by the storagesvc. */
  id: string;
}

/**
 * Lists all archive IDs currently stored in the Fission storage service.
 */
export async function listArchives(): Promise<string[]> {
  const { kc } = await getK8sApi();

  const cluster = kc.getCurrentCluster();
  if (!cluster) {
    throw new Error("No current cluster found in kubeconfig");
  }

  const url = storageSvcUrl(cluster.server, "/v1/archive");
  const fetchOpts = await resolveFetchOptions(kc);
  const res = await fetch(url, { ...fetchOpts, method: "GET" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storagesvc list failed (${res.status}): ${text}`);
  }

  return (await res.json()) as string[];
}

/**
 * Uploads a zip buffer to the Fission storage service via the K8s API proxy.
 * Returns the archive ID and the internal cluster URL to embed in a Package spec.
 *
 * @param stream
 * @param filename e.g. `{projectId}.zip`
 * @param knownLength
 */
export async function uploadArchive(
  stream: Readable,
  filename: string,
  knownLength?: number,
): Promise<UploadedArchive> {
  const { kc } = await getK8sApi();

  const cluster = kc.getCurrentCluster();
  if (!cluster) {
    throw new Error("No current cluster found in kubeconfig");
  }

  const url = storageSvcUrl(cluster.server, "/v1/archive");

  const form = new FormData();
  form.append("uploadfile", stream, {
    filename,
    contentType: "application/zip",
    knownLength,
  });

  const fetchOpts = await resolveFetchOptions(kc);

  const headers: Record<string, string> = {};
  if (fetchOpts.headers) {
    if (typeof (fetchOpts.headers as any).forEach === "function") {
      (fetchOpts.headers as any).forEach((value: string, key: string) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, fetchOpts.headers);
    }
  }
  Object.assign(headers, form.getHeaders());

  const res = await fetch(url, {
    ...fetchOpts,
    method: "POST",
    body: form,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storagesvc upload failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { id: string };
  const archiveId = json.id;

  return { id: archiveId };
}

/**
 * Deletes an archive from the Fission storage service via the K8s API proxy.
 *
 * @param archiveId
 */
export async function deleteArchive(archiveId: string): Promise<void> {
  const { kc } = await getK8sApi();

  const cluster = kc.getCurrentCluster();
  if (!cluster) {
    throw new Error("No current cluster found in kubeconfig");
  }

  const url = storageSvcUrl(cluster.server, "/v1/archive", { id: archiveId });

  const fetchOpts = await resolveFetchOptions(kc);
  const res = await fetch(url, { ...fetchOpts, method: "DELETE" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storagesvc delete failed (${res.status}): ${text}`);
  }
}
