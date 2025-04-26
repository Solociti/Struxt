import { customError } from "common/custom-error/custom-error";
import { getKey, setEx } from "server/database/dragonFly";
import { NpmErrorResponse, NpmTokenResponse } from "./types";

const userName = process.env.NGINX_PROXY_MANAGER_USER;
const password = process.env.NGINX_PROXY_MANAGER_PASS;

/**
 * The base hostname for Nginx Proxy Manager
 */
const hostname = "http://nginx:81";
/**
 * The key for the bearer token in the database
 */
const npmTokenKey = `npm:api:${userName}:token`;

/**
 * Get the bearer token for Nginx Proxy Manager
 */
export async function getBearerToken() {
  // load the token from the database
  const token = await getKey(npmTokenKey);
  if (token) {
    return token;
  }

  // if the token is not set, we need to get a new one
  const response = await fetch(new URL("/api/tokens", hostname), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scope: "user",
      identity: userName,
      secret: password,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to get bearer token");
  }

  const data: NpmTokenResponse | NpmErrorResponse = await response.json();

  if ("error" in data) {
    throw customError(data.error.code, data.error.message);
  }
  if (!data.token) {
    throw new Error("Failed to get bearer token");
  }

  // set the token in the database
  const expires = new Date(data.expires);
  const ttlSec = Math.floor((expires.getTime() - Date.now()) / 1000) - 60;

  await setEx(npmTokenKey, ttlSec, data.token);

  return data.token;
}

/**
 * Send a request to the NPM API
 *
 * @param endpoint
 * @param method
 * @param body
 * @returns
 */
export async function callNpmApi(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: any
) {
  const token = await getBearerToken();

  const url = new URL(endpoint, hostname);

  if ((method === "GET" || method === "DELETE") && body) {
    // if the method is GET or DELETE,
    // we need to add the body to the url as query params
    const params = new URLSearchParams(body);
    url.search = params.toString();
    body = undefined;
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data: any = await response.json();

  if ("error" in data) {
    throw customError(data.error.code, data.error.message);
  }
  if (!response.ok) {
    throw new Error("Failed to call NPM API");
  }

  return data;
}
