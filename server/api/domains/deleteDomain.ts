import { customError } from "common/custom-error/custom-error";
import {
  EnvironmentTypes,
  getPrimaryDomain,
} from "common/models/projects/Environment";
import { getCollection } from "server/database/mongodb";
import { getProjectData } from "../projects/getProject";

/**
 * Delete a domain from the project environment.
 *
 * @param projectId
 * @param environment
 * @param domain
 * @param user
 * @returns
 */
export async function deleteDomain(
  projectId: string,
  environment: EnvironmentTypes,
  domain: string,
  user: { userId: string; displayName: string }
) {
  // load the project
  const project = await getProjectData(projectId);
  const env = project[environment];

  const domainData = env.domains.find((d) => d.domain === domain);
  if (!domainData) {
    throw customError(400, "Invalid domain provided.");
  }

  const defaultDomain = getPrimaryDomain(env.domains);

  // prevent deleting the default domain
  if (defaultDomain && defaultDomain.domain === domain) {
    throw customError(400, "Cannot delete the default domain.");
  }

  if (domainData.dnsVerified.active) {
    // mark the domain as deleted
    domainData.deleted = {
      ...domainData.deleted,
      active: true,
      date: Math.floor(Date.now() / 1000),
      ...user,
    };

    if (domainData.enabled.active) {
      // if the domain is enabled, disable it
      domainData.enabled = {
        ...domainData.enabled,
        active: false,
        date: Math.floor(Date.now() / 1000),
        ...user,
      };
    }
  } else {
    // if the domain is not verified, just remove it
    env.domains = env.domains.filter((d) => d.domain !== domain);
  }

  // save the project
  const collection = await getCollection("projects");

  await collection.updateOne(
    {
      projectId,
    },
    {
      $set: {
        [environment]: env,
      },
    }
  );

  return {
    updatedEnv: env,
    success: true,
  };
}
