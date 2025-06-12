import dns from "node:dns/promises";

/**
 * Resolve the dns for a given domain.
 *
 * @param domain
 * @returns
 */
export async function resolveDns(
  domain: string
): Promise<{ ips: string[]; cname: string[] }> {
  if (!domain) {
    return {
      ips: [],
      cname: [],
    };
  }

  // Resolve the A records for the given domain
  const ips = await dns.resolve(domain, "A");
  const cname = await resolveCname(domain);

  return { ips, cname };
}

/**
 * Resolve the CNAME records for a given domain.
 *
 * Returns an empty array if the domain is not provided or if there are no CNAME records.
 *
 * @param domain
 * @returns
 */
async function resolveCname(domain: string): Promise<string[]> {
  if (!domain) {
    return [];
  }

  return await dns.resolve(domain, "CNAME").catch(() => []);
}
