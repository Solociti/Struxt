import isValidDomain from "is-valid-domain";
import { getRegisterDomain } from "./proxyDomain";

const blacklist: string[] = [];

(() => {
  const envKeys = [
    "KEYCLOAK_HOSTNAME",
    "KEYCLOAK_ADMIN_HOSTNAME",
    "STRUXT_DOMAIN",
    "STRUXT_REGISTER_DOMAIN",
    "STRUXT_PROXY_DOMAIN",
  ];

  for (const key of envKeys) {
    let value = process.env[key];

    if (!value) {
      continue;
    }

    if (value?.includes("https://") || value?.includes("http://")) {
      const url = new URL(value);
      value = url.hostname;
    }

    if (!blacklist.includes(value)) {
      blacklist.push(value);
    }
  }

  blacklist.sort();
})();

/**
 * Get the list of blacklisted domains.
 *
 * @returns
 */
export function getBlacklistedDomains(): string[] {
  return blacklist;
}

/**
 * Set the list of blacklisted domains.
 *
 * @param domains
 */
export function setBlacklistedDomains(domains: string[]): void {
  blacklist.length = 0;
  blacklist.push(...domains);
  blacklist.sort();
}

/**
 * Process and validate the domain with the given information.
 *
 * @param domain
 * @param isSubdomain
 */
export function validateDomain(
  domain: string,
  isSubdomain: boolean
): { domain: string; isValid: boolean } {
  if (!domain || domain.length < 3) {
    return { domain: "", isValid: false };
  }

  // setup the free domain using the domain value as subdomain
  if (isSubdomain) {
    if (domain.includes(".")) {
      return { domain: "", isValid: false };
    }

    const baseDomain = getRegisterDomain();
    domain = `${domain}.${baseDomain}`;
  }

  const normalizedDomain = domain.trim().toLowerCase();

  if (!isValidDomain(normalizedDomain)) {
    return { domain: "", isValid: false };
  }

  if (isSubdomain) {
    if (blacklist.includes(normalizedDomain)) {
      return { domain: "", isValid: false };
    }
  } else {
    for (const d of blacklist) {
      if (normalizedDomain.endsWith(d)) {
        return { domain: "", isValid: false };
      }
    }
  }

  return { domain: normalizedDomain, isValid: true };
}
