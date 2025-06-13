import {
  EnvironmentTypes,
  ProjectEnvSettings,
} from "common/models/projects/Environment";
import { Api } from "../api";

export interface DomainInfoApi extends Api {
  Endpoint: "/api/projects/domains/info";

  UrlParams: {};

  GetQuery: {};
  GetResponse: {
    freeBaseDomain: string;
    dnsSettings: {
      proxy: string;
      ips: string[];
    };
  };
}

export interface DomainRegisterApi extends Api {
  Endpoint: "/api/projects/:projectId/domains/register";

  UrlParams: {
    projectId: string;
  };

  GetQuery: {
    /**
     * Check if the domain is available for setup
     */
    domain?: string;
    /**
     * Check if the subdomain is available for setup
     */
    freeSubdomain?: string;
  };

  GetResponse: {
    /**
     * If the domain is available for setup
     */
    available: boolean;

    /**
     * If the domain was valid.
     */
    isValid: boolean;

    /**
     * The updated domain if it was valid.
     */
    domain: string;
  };

  PostBody: {
    /**
     * The project environment to register the domain for.
     */
    environment: EnvironmentTypes;

    /**
     * When registering a custom domain.
     */
    domain: string;

    /**
     * When registering a free subdomain.
     */
    freeSubdomain: string;
  };
  PostResponse: {
    /**
     * The project environment to update the domain for.
     */
    environment: ProjectEnvSettings;

    success: boolean;
  };
}

export interface DomainDnsVerifyApi extends Api {
  Endpoint: "/api/projects/:projectId/domains/verify-dns";

  PostBody: {
    /**
     * The project environment
     */
    environment: EnvironmentTypes;
    domain: string;
  };

  PostResponse: {
    /**
     * Tells if the dns is valid for the domain.
     */
    isValid: boolean;

    /**
     * Tells if the domain is a root domain (e.g. example.com).
     *
     * root domains don't need the cname set.
     */
    isRootDomain: boolean;

    dnsRecords: {
      type: "A" | "CNAME";
      value: string;
      valid: boolean;
    }[];

    /**
     * The list of ips that the domain resolves to.
     */
    resolvedIps: string[];
  };
}

export interface DomainUpdateApi extends Api {
  Endpoint: "/api/projects/:projectId/domains/update";

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    /**
     * The project environment to update the domain for.
     */
    environment: EnvironmentTypes;

    changes: (
      | Partial<Pick<ProjectEnvSettings, "forceSsl" | "hsts">>
      | { domain: string; enabled?: boolean; primary?: boolean }
    )[];
  };
  PostResponse: {
    success: boolean;

    updatedEnv: ProjectEnvSettings;
  };

  DeleteQuery: {
    environment: EnvironmentTypes;
    domain: string;
  };
  DeleteResponse: {
    success: boolean;
  };
}
