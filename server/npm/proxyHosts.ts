import { callNpmApi } from "./apiSetup";
import {
  NpmProxyHostsResponse,
  ProxyHostResponse,
  ProxyHostUpdate,
} from "./types";

/**
 * Get the list of proxy hosts from NPM
 *
 * @returns
 */
export async function getProxyHosts() {
  const data: NpmProxyHostsResponse = await callNpmApi(
    "/api/nginx/hosts",
    "GET"
  );
  return data;
}

/**
 * Get a single proxy host from NPM
 *
 * @param id
 * @returns
 */
export async function getProxyHost(id: number) {
  const data: ProxyHostResponse = await callNpmApi(
    `/api/nginx/hosts/${id}`,
    "GET"
  );
  return data;
}

/**
 * Create a new proxy host in NPM
 *
 * @param host
 * @returns
 */
export async function createProxyHost(host: ProxyHostUpdate) {
  const data: ProxyHostResponse = await callNpmApi(
    "/api/nginx/hosts",
    "POST",
    host
  );
  return data;
}

/**
 * Update a proxy host in NPM
 *
 * @param host
 * @returns
 */
export async function updateProxyHost(id: number, host: ProxyHostUpdate) {
  const data: ProxyHostResponse = await callNpmApi(
    `/api/nginx/hosts/${id}`,
    "PUT",
    host
  );
  return data;
}

/**
 * Delete a proxy host in NPM
 *
 * @param id
 * @returns
 */
export async function deleteProxyHost(id: number) {
  const data: boolean = await callNpmApi(`/api/nginx/hosts/${id}`, "DELETE");
  return data;
}
