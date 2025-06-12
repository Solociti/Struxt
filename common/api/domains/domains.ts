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
    success: boolean;
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
