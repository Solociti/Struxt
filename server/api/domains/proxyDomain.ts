import { customError } from "common/custom-error/custom-error";

/**
 * Get the proxy domain from the environment variable.
 *
 * @returns
 */
export function getProxyDomain() {
  const proxyDomain = process.env.STRUXT_PROXY_DOMAIN;
  if (!proxyDomain) {
    throw customError(
      500,
      "The STRUXT_PROXY_DOMAIN environment variable is not set."
    );
  }

  return proxyDomain;
}

/**
 * Get the register domain from the environment variable.
 *
 * @returns
 */
export function getRegisterDomain() {
  const registerDomain = process.env.STRUXT_REGISTER_DOMAIN;
  if (!registerDomain) {
    throw customError(
      500,
      "The STRUXT_REGISTER_DOMAIN environment variable is not set."
    );
  }

  return registerDomain;
}
