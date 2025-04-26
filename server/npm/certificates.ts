import { callNpmApi } from "./apiSetup";
import { CertificateResponse, CertificateUpdate } from "./types";

/**
 * Checks if the HTTP requests to the given domains reach NPM.
 *
 * This needs to be called before creating and enabling ssl certificates for the domains.
 *
 * The response is a map of the domains to their status.
 * Only status `"ok"` is considered a success.
 * Other statuses are considered a failure.
 *
 * @param domains
 */
export async function testHttpRequest(domains: string[]) {
  const response: Record<string, "ok" | string> = await callNpmApi(
    "/api/nginx/certificates/test-http",
    "GET",
    {
      domains: JSON.stringify(domains),
    }
  );

  return response;
}

/**
 * Get the list of certificates from NPM
 *
 * @returns
 */
export async function getCertificates() {
  const data: CertificateResponse[] = await callNpmApi(
    "/api/nginx/certificates",
    "GET"
  );
  return data;
}

/**
 * Get a single certificate from NPM
 *
 * @param id
 * @returns
 */
export async function getCertificate(id: number) {
  const data: CertificateResponse = await callNpmApi(
    `/api/nginx/certificates/${id}`,
    "GET"
  );
  return data;
}

/**
 * Create a new certificate in NPM
 *
 * @param certificate
 * @returns
 */
export async function createCertificate(certificate: CertificateUpdate) {
  const data: CertificateResponse = await callNpmApi(
    "/api/nginx/certificates",
    "POST",
    certificate
  );

  return data;
}

/**
 * Delete a certificate in NPM
 *
 * @param id
 * @returns
 */
export async function deleteCertificate(id: number) {
  const data: boolean = await callNpmApi(
    `/api/nginx/certificates/${id}`,
    "DELETE"
  );

  return data;
}

/**
 * Renew a certificate in NPM
 *
 * @param id
 * @returns
 */
export async function renewCertificate(id: number) {
  const data: CertificateResponse = await callNpmApi(
    `/api/nginx/certificates/${id}/renew`,
    "POST"
  );

  return data;
}
