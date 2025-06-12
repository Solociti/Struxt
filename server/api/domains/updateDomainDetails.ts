import { DomainUpdateApi } from "common/api/domains/domains";
import { customError } from "common/custom-error/custom-error";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { getCollection } from "server/database/mongodb";
import { getProjectData } from "../projects/getProject";

/**
 * Update the domain details for a project environment.
 *
 * @param projectId
 * @param environment
 * @param changes
 */
export async function updateDomainDetails(
  projectId: string,
  environment: EnvironmentTypes,
  changes: DomainUpdateApi["PostBody"]["changes"],
  user: { userId: string; displayName: string }
) {
  // load the project. Throws if not found.
  const project = await getProjectData(projectId);
  const env = project[environment];

  for (const change of changes) {
    // handle updating a domain's details
    if ("domain" in change && typeof change.domain === "string") {
      const domainDetails = env.domains.find((d) => d.domain === change.domain);

      if (!domainDetails) {
        throw customError(400, "Domain not found in environment");
      }

      // handle enabling or disabling the domain
      if ("enabled" in change && typeof change.enabled === "boolean") {
        if (domainDetails.deleted.active) {
          // undo deletion if the domain is being enabled
          domainDetails.deleted = {
            active: false,
            date: 0,
            ...user,
          };
        }

        domainDetails.enabled = {
          ...domainDetails.enabled,
          ...user,
          active: change.enabled,
          date: Math.floor(Date.now() / 1000),
        };
      }

      if ("primary" in change && typeof change.primary === "boolean") {
        if (change.primary) {
          // reset all domains to not primary
          env.domains.forEach((d) => {
            d.isPrimary = false;
          });
          domainDetails.isPrimary = true;
        } else {
          domainDetails.isPrimary = false;
        }
      }
    } else {
      if ("forceSsl" in change && typeof change.forceSsl === "boolean") {
        // update force SSL setting
        env.forceSsl = change.forceSsl;
      }

      if ("hsts" in change && typeof change.hsts === "boolean") {
        // update HSTS setting
        env.hsts = change.hsts;
      }
    }
  }

  // update the values in database
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
