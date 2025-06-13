import {
  EnvironmentTypes,
  setupDomainData,
} from "common/models/projects/Environment";
import { getCollection } from "server/database/mongodb";
import { getProjectData } from "../projects/getProject";

/**
 * This function adds a new domain to the project.
 *
 * ! This method does not validate the domain, it assumes that the domain is valid.
 *
 * @param projectId
 * @param environment
 * @param domain
 * @param user
 */
export async function addDomain(
  projectId: string,
  environment: EnvironmentTypes,
  domain: string,
  user: {
    userId: string;
    displayName: string;
  }
) {
  // load the project. Throws if not found.
  const project = await getProjectData(projectId);
  const env = project[environment];

  // add the domain to the environment
  const domainData = setupDomainData({
    domain,
    created: {
      ...user,
    },
    dnsVerified: {
      active: false,
    },
    enabled: {
      active: false,
    },
  });

  env.domains.push(domainData);

  // update the project in the database
  const collection = await getCollection("projects");
  await collection.updateOne(
    { projectId },
    {
      $set: {
        [environment]: env,
      },
    }
  );

  return {
    updatedEnv: env,
  };
}
