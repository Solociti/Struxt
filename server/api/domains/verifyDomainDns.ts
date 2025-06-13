import { DomainDnsVerifyApi } from "common/api/domains/domains";
import { customError } from "common/custom-error/custom-error";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { getCollection } from "server/database/mongodb";
import { resolveDns } from "server/utils/dns/resolveDns";
import { getProjectData } from "../projects/getProject";
import { getProxyDomain } from "./proxyDomain";

/**
 * Verify the DNS settings for a domain in a project environment.
 *
 * @param projectId
 * @param environment
 * @param domain
 */
export async function verifyDomainDns(
  projectId: string,
  environment: EnvironmentTypes,
  domain: string
): Promise<DomainDnsVerifyApi["PostResponse"]> {
  // load the project
  const project = await getProjectData(projectId);

  // check if the domain exists in the project
  const env = project[environment];
  const domainData = env.domains.find((d) => d.domain === domain);
  if (!domainData) {
    throw customError(400, "Domain not found for the project.");
  }

  const isRootDomain = domain.split(".").length === 2;

  // get the dns records for the domain
  const dns = await resolveDns(domainData.domain);

  const proxyDomain = getProxyDomain();
  const proxyDns = await resolveDns(proxyDomain);

  // create a list of DNS records to return
  const records: DomainDnsVerifyApi["PostResponse"]["dnsRecords"] = [];

  for (const domain of dns.cname) {
    records.push({
      type: "CNAME",
      value: domain,
      valid: domain === proxyDomain,
    });
  }

  for (const ip of dns.ips) {
    records.push({
      type: "A",
      value: ip,
      valid: proxyDns.ips.includes(ip),
    });
  }

  const isValid = records.length > 0 && records.every((r) => r.valid);

  if (isValid !== domainData.dnsVerified.active) {
    domainData.dnsVerified = {
      ...domainData.dnsVerified,
      active: isValid,
      date: Math.floor(Date.now() / 1000),
    };

    // update the domain data in the project
    const collection = await getCollection("projects");
    await collection.updateOne(
      { projectId },
      {
        $set: {
          [environment]: env,
        },
      }
    );
  }

  return {
    isValid,
    isRootDomain,
    dnsRecords: records,
    resolvedIps: dns.ips,
  };
}
