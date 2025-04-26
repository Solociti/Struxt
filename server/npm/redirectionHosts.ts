import { callNpmApi } from "./apiSetup";
import { RedirectHostResponse, RedirectHostUpdate } from "./types";

/**
 * Get the list of redirection hosts from NPM
 *
 * @returns
 */
export async function getRedirectionHosts() {
  const data: RedirectHostResponse[] = await callNpmApi(
    "/api/nginx/redirection-hosts",
    "GET"
  );
  return data;
}

/**
 * Get a single redirection host from NPM
 *
 * @param id
 * @returns
 */
export async function getRedirectionHost(id: number) {
  const data: RedirectHostResponse = await callNpmApi(
    `/api/nginx/redirection-hosts/${id}`,
    "GET"
  );
  return data;
}

/**
 * Create a new redirection host in NPM
 *
 * @param host
 * @returns
 */
export async function createRedirectionHost(host: RedirectHostUpdate) {
  const data: RedirectHostResponse = await callNpmApi(
    "/api/nginx/redirection-hosts",
    "POST",
    host
  );
  return data;
}

/**
 * Update a redirection host in NPM
 *
 * @param id
 * @param host
 * @returns
 */
export async function updateRedirectionHost(
  id: number,
  host: RedirectHostUpdate
) {
  const data: RedirectHostResponse = await callNpmApi(
    `/api/nginx/redirection-hosts/${id}`,
    "PUT",
    host
  );
  return data;
}

/**
 * Delete a redirection host in NPM
 *
 * @param id
 * @returns
 */
export async function deleteRedirectionHost(id: number) {
  const data: RedirectHostResponse = await callNpmApi(
    `/api/nginx/redirection-hosts/${id}`,
    "DELETE"
  );
  return data;
}
