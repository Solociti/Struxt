import axios, { AxiosError } from "axios";
import { internalExpressPort } from "./internalExpressSetup";
import { HostRoutes } from "./internalRoutes";
import {
  customError,
  deStructureError,
} from "common/custom-error/custom-error";

/**
 * Makes a request to the internal server.
 *
 * @param host
 * @param path
 * @param body
 * @param timeout
 */
export async function internalRequest<
  Host extends keyof HostRoutes,
  Path extends keyof HostRoutes[Host]
>(
  host: Host,
  path: Path,
  body: HostRoutes[Host][Path] extends { request: infer R } ? R : never,
  timeout?: number
): Promise<HostRoutes[Host][Path] extends { response: infer R } ? R : never> {
  const url = new URL(path as string, `http://${host}`);
  url.port = internalExpressPort.toString();

  // make the request using axios
  try {
    const response = await axios.post(url.toString(), body, {
      timeout: typeof timeout === "number" ? timeout : 2000,
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response && error.response.data && error.response.data.error) {
        const err = deStructureError(error.response.data.error);

        throw err;
      } else {
        throw customError(500, error.message);
      }
    }

    throw error;
  }
}
