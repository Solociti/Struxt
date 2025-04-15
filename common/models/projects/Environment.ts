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
   * Enables HSTS for the domain.
   *
   * Has no effect if forceSsl is false
   */
  hsts: boolean;

  domains: {
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
  }[];
}

export function setupProjectEnvSettings(
  data: DeepPartial<ProjectEnvSettings>
): ProjectEnvSettings {
  const setting: ProjectEnvSettings = {
    forceSsl: true,
    hsts: true,
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
      };

      return mergeDeep(
        domain,
        data as Partial<ProjectEnvSettings["domains"][number]>
      );
    });
  }

  return setting;
}
