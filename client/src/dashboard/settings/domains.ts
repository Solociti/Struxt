import { getApi, postApi } from "client/api/api";
import { DomainInfoApi, DomainRegisterApi } from "common/api/domains/domains";

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
