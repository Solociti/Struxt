import {
  DomainDnsVerifyApi,
  DomainInfoApi,
  DomainRegisterApi,
  DomainUpdateApi,
} from "common/api/domains/domains";
import { customError } from "common/custom-error/custom-error";
import { validEnvironments } from "common/models/projects/Environment";
import { roles } from "common/models/user/Roles";
import { resolveDns } from "server/utils/dns/resolveDns";
import { registerApi } from "../registerApi";
import { addDomain } from "./addDomain";
import { checkDomainAvailability } from "./checkDomainAvailability";
import { getProxyDomain, getRegisterDomain } from "./proxyDomain";
import { updateDomainDetails } from "./updateDomainDetails";
import { validateDomain } from "./validateDomain";
import { verifyDomainDns } from "./verifyDomainDns";

// get the domain information for struxt
registerApi<DomainInfoApi>("/api/projects/domains/info").get(
  [roles.struxt.editor, roles.struxt.admin],
  async () => {
    const proxyDomain = getProxyDomain();
    const registerDomain = getRegisterDomain();

    try {
      const { ips } = await resolveDns(proxyDomain);

      // get the dns settings needed to setup a domain
      const dnsSettings = {
        proxy: proxyDomain,
        ips,
      };

      return {
        freeBaseDomain: registerDomain,
        dnsSettings,
      };
    } catch (err) {
      throw customError(500, "Failed to resolve DNS for the proxy domain.");
    }
  }
);

registerApi<DomainRegisterApi>("/api/projects/:projectId/domains/register")
  .get(
    [roles.struxt.editor, roles.struxt.admin],
    async ({ params, user, query }) => {
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

      const domain = query.domain || query.freeSubdomain;
      const isFreeDomain = !query.domain && Boolean(query.freeSubdomain);

      if (!domain) {
        throw customError(
          400,
          "You must specify either a domain or a subdomain to check availability."
        );
      }

      // validate the domain or subdomain
      const result = validateDomain(domain, isFreeDomain);

      if (!result.isValid) {
        return {
          domain: "",
          isValid: false,
          available: false,
        };
      }

      // check that the domain is available / not used in a project
      const isAvailable = await checkDomainAvailability(result.domain);

      return {
        domain: result.domain,
        isValid: result.isValid,
        available: isAvailable,
      };
    }
  )
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
          "You don't have access to register a domain for this project."
        );
      }

      // validate the environment given
      if (!body.environment || !validEnvironments.includes(body.environment)) {
        throw customError(400, "Invalid environment specified.");
      }

      const domain = body.domain || body.freeSubdomain;
      const isFreeDomain = !body.domain && Boolean(body.freeSubdomain);

      if (!domain) {
        throw customError(
          400,
          "You must specify either a domain or a subdomain to check availability."
        );
      }

      // validate the domain or subdomain
      const validResult = validateDomain(domain, isFreeDomain);
      if (!validResult.isValid) {
        throw customError(400, "The provided domain is not valid.");
      }

      const isAvailable = await checkDomainAvailability(validResult.domain);
      if (!isAvailable) {
        throw customError(400, "The provided domain is not available.");
      }

      // setup a new domain for a project
      const domainResult = await addDomain(
        projectId,
        body.environment,
        validResult.domain,
        {
          userId: user.id,
          displayName: user.name,
        }
      );

      return {
        success: true,
        environment: domainResult.updatedEnv,
      };
    }
  );

registerApi<DomainDnsVerifyApi>(
  "/api/projects/:projectId/domains/verify-dns"
).post(
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
        "You don't have access to register a domain for this project."
      );
    }

    // validate the environment given
    if (!body.environment || !validEnvironments.includes(body.environment)) {
      throw customError(400, "Invalid environment specified.");
    }

    if (!body.domain) {
      throw customError(
        400,
        "You must specify either a domain or a subdomain to check availability."
      );
    }

    // verify the DNS settings for the domain
    const response = await verifyDomainDns(
      projectId,
      body.environment,
      body.domain
    );

    return response;
  }
);

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
        throw customError(400, "Invalid environment specified.");
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
