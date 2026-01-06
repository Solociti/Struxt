import { Api } from "common/api/api";
import { deStructureError } from "common/custom-error/custom-error";

type QueryParams = URLSearchParams | Record<string, string>;

/**
 * Build the url to use for the api request
 *
 * @param url
 * @param query
 * @returns
 */
function buildUrl(url: string | string[] | URL, query?: QueryParams) {
  url = Array.isArray(url) ? url.join("/") : url;
  url = new URL(url.toString(), window.location.origin);

  if (query) {
    if (query instanceof URLSearchParams) {
      url.search = query.toString();
    } else {
      url.search = new URLSearchParams(query).toString();
    }
  }
  return url;
}

interface ApiOptions {
  /**
   * The method to use for the request
   */
  method: "GET" | "POST" | "PUT" | "DELETE";

  /**
   * Optionally add headers to the request
   *
   * json content type is added by default
   */
  headers?: Record<string, string>;

  /**
   * Set a timeout for the request.
   *
   * Defaults to 10 seconds
   * Only set this value if the timeout needs to be longer.
   */
  timeoutMs?: number;

  /**
   * The query parameters to add to the request
   */
  query?: QueryParams;

  /**
   * The body to send with the request
   */
  body?: any;
}

/**
 * Send an api request
 *
 * @param url
 * @param options
 * @returns
 */
export async function callApi(
  url: string | string[] | URL,
  options: ApiOptions
) {
  const fetchUrl = buildUrl(url, options.query);

  // setup the abort controller for timeouts
  const controller = new AbortController();
  const timeout = options.timeoutMs || 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let responseCode: number = 0;

  try {
    const headers: Record<string, string> = {};
    let body: any = undefined;

    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      body = JSON.stringify(options.body);
      headers["Content-Type"] = "application/json";
    }

    // start the fetch request
    const res = await fetch(fetchUrl, {
      method: options.method,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
      body,
    });
    responseCode = res.status;

    const data = await res.json();

    // check if the server sent an error
    if (data.error) {
      // build a new error object
      throw deStructureError(
        data.error,
        "An error occurred while processing the request."
      );
    }

    return data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      err.name = "TimeoutError";
      err.message = "Request timed out.";
    }

    // set the response code on the error
    if (err instanceof Error && !err.status) {
      err.status = responseCode;
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Send a get request to the api
 *
 * @param url
 * @param params
 * @param options
 * @returns
 */
export async function getApi<D extends Api>(
  url: D["Endpoint"] | D["EndpointParts"] | URL,
  params?: D["GetQuery"],
  options?: Omit<ApiOptions, "body" | "method" | "query">
): Promise<D["GetResponse"]> {
  return await callApi(url, {
    method: "GET",
    query: params,
    ...options,
  });
}

/**
 * Send a post request to the api
 *
 * @param url
 * @param body
 * @param options
 * @returns
 */
export async function postApi<D extends Api>(
  url: D["Endpoint"] | D["EndpointParts"] | URL,
  body: D["PostBody"],
  options?: Omit<ApiOptions, "body" | "method">
): Promise<D["PostResponse"]> {
  return await callApi(url, {
    method: "POST",
    body,
    ...options,
  });
}

/**
 * Send a put request to the api
 *
 * @param url
 * @param body
 * @param options
 * @returns
 */
export async function putApi<D extends Api>(
  url: D["Endpoint"] | D["EndpointParts"] | URL,
  body: D["PutBody"],
  options?: Omit<ApiOptions, "body" | "method">
): Promise<D["PutResponse"]> {
  return await callApi(url, {
    method: "PUT",
    body,
    ...options,
  });
}

/**
 * Send a delete request to the api
 *
 * @param url
 * @param options
 * @returns
 */
export async function deleteApi<D extends Api>(
  url: D["Endpoint"] | D["EndpointParts"] | URL,
  query?: D["DeleteQuery"],
  options?: Omit<ApiOptions, "body" | "method" | "query">
): Promise<D["DeleteResponse"]> {
  return await callApi(url, {
    method: "DELETE",
    query,
    ...options,
  });
}
