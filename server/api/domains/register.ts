import {
  DomainInfoApi,
  DomainRegisterApi,
  DomainUpdateApi,
} from "common/api/domains/domains";
import { customError } from "common/custom-error/custom-error";
import { roles } from "common/models/user/Roles";
import { resolveDns } from "server/utils/dns/resolveDns";
import { registerApi } from "../registerApi";
import { updateDomainDetails } from "./updateDomainDetails";
import { validEnvironments } from "common/models/projects/Environment";

// get the domain information for struxt
registerApi<DomainInfoApi>("/api/projects/domains/info").get(
  [roles.struxt.editor, roles.struxt.admin],
  async () => {
    const proxyDomain = process.env.STRUXT_PROXY_DOMAIN || "";

    // get the A records for the proxy domain
    if (!proxyDomain) {
      throw customError(
        500,
        "The STRUXT_PROXY_DOMAIN environment variable is not set."
      );
    }

    try {
      const { ips } = await resolveDns(proxyDomain);

      // get the dns settings needed to setup a domain
      const dnsSettings = {
        proxy: process.env.STRUXT_PROXY_DOMAIN || "",
        ips,
      };

      return {
        freeBaseDomain: process.env.STRUXT_REGISTER_DOMAIN || "",
        dnsSettings,
      };
    } catch (err) {
      throw customError(500, "Failed to resolve DNS for the proxy domain.");
    }
  }
);

registerApi<DomainRegisterApi>(
  "/api/projects/:projectId/domains/register"
).post([roles.struxt.editor, roles.struxt.admin], async ({ params, user }) => {
  const projectId = params.projectId;

  // check if the user has access to the project
  if (
    !user.hasPermission(roles.struxt.admin) &&
    !user.hasProjectPermission(projectId, [roles.projects.admin])
  ) {
    throw customError(
      403,
      "You don't have access to register a domain for this project."
    );
  }

  // TODO: setup a new domain for a project

  return {
    success: false,
  };
});

// handle updating the domain details for a project environment
registerApi<DomainUpdateApi>("/api/projects/:projectId/domains/update")
  .post(
    [roles.struxt.editor, roles.struxt.admin],
    async ({ params, user, body }) => {
      const projectId = params.projectId;

      // check if the user has access to the project
      if (
        !user.hasPermission(roles.struxt.admin) &&
        !user.hasProjectPermission(projectId, [roles.projects.admin])
      ) {
        throw customError(
          403,
          "You don't have access to update a domain for this project."
        );
      }

      // ensure that its a valid environment
      if (!body.environment || !validEnvironments.includes(body.environment)) {
        throw customError(401, "Invalid environment specified.");
      }

      if (!body.changes || body.changes.length === 0) {
        throw customError(400, "No changes specified to update the domain.");
      }

      // process the changes
      const { updatedEnv } = await updateDomainDetails(
        projectId,
        body.environment,
        body.changes,
        {
          userId: user.id,
          displayName: user.name,
        }
      );

      return {
        success: true,
        updatedEnv,
      };
    }
  )
  .delete(
    [roles.struxt.editor, roles.struxt.admin],
    async ({ params, user, query }) => {
      const projectId = params.projectId;
      const { environment, domain } = query;

      // check if the user has access to the project
      if (
        !user.hasPermission(roles.struxt.admin) &&
        !user.hasProjectPermission(projectId, [roles.projects.admin])
      ) {
        throw customError(
          403,
          "You don't have access to delete a domain for this project."
        );
      }

      return {
        success: false,
      };
    }
  );
