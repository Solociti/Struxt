import { getCollection } from "server/database/mongodb";

/**
 * Checks if a domain is still available for registration.
 *
 * @param domain
 * @param isFreeDomain
 * @returns
 */

export async function checkDomainAvailability(
  domain: string
): Promise<boolean> {
  if (!domain) {
    return false;
  }

  // checks that the domain is not already registered to a project
  const collection = await getCollection("projects");

  const domainExists = await collection.findOne(
    {
      $or: [
        { "staging.domains.domain": domain },
        { "production.domains.domain": domain },
      ],
    },
    {
      projection: {
        projectId: 1,
      },
    }
  );

  return !domainExists;
}
