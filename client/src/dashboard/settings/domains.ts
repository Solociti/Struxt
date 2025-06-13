import { getApi, postApi } from "client/api/api";
import {
  DomainDnsVerifyApi,
  DomainInfoApi,
  DomainRegisterApi,
  DomainUpdateApi,
} from "common/api/domains/domains";
import { EnvironmentTypes } from "common/models/projects/Environment";

/**
 * Get the global domain information / settings.
 *
 * @returns
 */
export async function getDomainInfo() {
  const result: DomainInfoApi["GetResponse"] = await getApi([
    "/api/projects/domains/info",
  ]);

  return result;
}

/**
 * Check if the given domain or subdomain is available for registration.
 *
 * @param projectId
 * @param domain
 * @param subDomain
 * @returns
 */
export async function checkDomainAvailability(
  projectId: string,
  domain: string,
  subDomain: string
): Promise<boolean> {
  if (domain.length < 3 && subDomain.length < 3) {
    return false;
  }

  const query: DomainRegisterApi["GetQuery"] = {};
  if (domain.length > 3) {
    query.domain = domain;
  } else if (subDomain.length > 3 && !subDomain.includes(".")) {
    query.freeSubdomain = subDomain;
  } else {
    return false;
  }

  const result: DomainRegisterApi["GetResponse"] = await getApi(
    ["/api/projects", projectId, "domains/register"],
    query
  );

  return Boolean(result.available);
}

/**
 * Add a new domain to the project.
 *
 * @param projectId
 * @param environment
 * @param domain
 * @param freeSubdomain
 * @returns
 */
export async function registerDomain(
  projectId: string,
  environment: "staging" | "production",
  domain: string,
  freeSubdomain: string
) {
  const body: DomainRegisterApi["PostBody"] = {
    environment,
    domain,
    freeSubdomain,
  };

  const result: DomainRegisterApi["PostResponse"] = await postApi(
    ["/api/projects", projectId, "domains/register"],
    body
  );

  return result;
}

/**
 * Send request to verify the DNS settings for a domain.
 *
 * @param projectId
 * @param environment
 * @param domain
 * @returns
 */
export async function verifyDomainDns(
  projectId: string,
  environment: EnvironmentTypes,
  domain: string
) {
  const body: DomainDnsVerifyApi["PostBody"] = {
    environment,
    domain,
  };

  const result: DomainDnsVerifyApi["PostResponse"] = await postApi(
    ["/api/projects", projectId, "domains/verify-dns"],
    body
  );
  return result;
}

/**
 * Update the domain details for a project environment.
 *
 * @param projectId
 * @param environment
 * @param changes
 * @returns
 */
export async function updateDomainDetails(
  projectId: string,
  environment: EnvironmentTypes,
  changes: DomainUpdateApi["PostBody"]["changes"]
) {
  const body: DomainUpdateApi["PostBody"] = {
    environment,
    changes,
  };

  const result: DomainUpdateApi["PostResponse"] = await postApi(
    ["/api/projects", projectId, "domains/update"],
    body
  );

  return result;
}
