import { ModelAction, UserModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";

export type EnvironmentTypes = "staging" | "production";

/**
 * Environment specific settings for a project
 */
export interface ProjectEnvSettings {
  /**
   * When true, will redirect all http traffic to https
   */
  forceSsl: boolean;

  /**
   * Ids for all of the records in the NGINX Proxy Manager
   */
  proxy: {
    /**
     * Set if an error occurred while creating the proxy host
     */
    error?: string;

    /**
     * NGINX Proxy Manager host id for this environment
     */
    hostId: number;

    /**
     * The redirect id for this environment
     */
    redirectId: number;

    /**
     * The certificate id for this environment
     */
    certificateId: number;
  };

  /**
   * Enables HSTS for the domain.
   *
   * Has no effect if forceSsl is false
   */
  hsts: boolean;

  domains: ProjectDomain[];
}

export interface ProjectDomain {
  /**
   * The domain name
   */
  domain: string;

  /**
   * if the domain is enabled or not.
   *
   * Default will be false.
   */
  enabled: UserModelAction;

  /**
   * Tells if the domain settings have been verified,
   * by the automated DNS verification process.
   */
  dnsVerified: ModelAction;

  /**
   * Tells if it's the primary domain for the project.
   *
   * None primary domains will be redirected to the primary domain.
   */
  isPrimary: boolean;

  /**
   * Set when the domain is deleted.
   */
  deleted: UserModelAction;
}

export function setupProjectEnvSettings(
  data: DeepPartial<ProjectEnvSettings>
): ProjectEnvSettings {
  const setting: ProjectEnvSettings = {
    forceSsl: true,
    hsts: true,
    proxy: {
      hostId: 0,
      redirectId: 0,
      certificateId: 0,
    },
    domains: [],
  };

  mergeDeep(setting, data, ["domains"]);

  if (data.domains) {
    setting.domains = data.domains.map((data) => {
      const domain: ProjectEnvSettings["domains"][number] = {
        domain: "",
        dnsVerified: {
          active: false,
          date: 0,
        },
        enabled: {
          active: false,
          date: 0,
          userId: "",
          displayName: "",
        },
        isPrimary: false,
        deleted: {
          active: false,
          date: 0,
          userId: "",
          displayName: "",
        },
      };

      return mergeDeep(
        domain,
        data as Partial<ProjectEnvSettings["domains"][number]>
      );
    });
  }

  return setting;
}

/**
 * Get the valid domains for the given environment settings.
 *
 * @param envSettings
 * @returns
 */
export function getValidDomains(envSettings: ProjectEnvSettings): {
  domains: ProjectDomain[];
  redirectDomains: ProjectDomain[];
  primaryDomain: ProjectDomain | null;
} {
  const domains = envSettings.domains.filter(
    (d) => d.enabled.active && d.dnsVerified.active && !d.deleted.active
  );

  const primaryDomain = getPrimaryDomain(domains);
  const redirectDomains = domains.filter(
    (d) => !primaryDomain || d.domain !== primaryDomain.domain
  );

  return { domains, redirectDomains, primaryDomain };
}

/**
 * Get the primary domain from the environment domain list
 *
 * @param domains
 * @returns
 */
export function getPrimaryDomain(
  domains: ProjectDomain[]
): ProjectDomain | null {
  const primaryDomain = domains.find((d) => d.isPrimary);
  if (primaryDomain) {
    return primaryDomain;
  }

  // if no primary domain is set, set the first one that starts with www
  const wwwDomain = domains.find((d) => d.domain.startsWith("www"));
  if (wwwDomain) {
    return wwwDomain;
  }

  // if no primary domain is set, set the first domain
  const firstDomain = domains[0];
  if (firstDomain) {
    return firstDomain;
  }

  return null;
}
