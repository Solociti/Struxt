import dns from "node:dns/promises";

/**
 * Check if the given domain has valid MX records.
 *
 * @param domain
 * @returns
 */
export async function hasValidMxRecord(domain: string): Promise<boolean> {
  if (!domain) {
    return false;
  }

  try {
    const mxRecords = await dns.resolveMx(domain);

    if (mxRecords.length > 0) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
