import { DomainDetails } from "./Domains";
import { FormDetails } from "./Forms";

export interface ProjectDetails {
  id: string;
  name: string;
  description: string;

  /**
   * The list of domains for the project
   */
  domains: DomainDetails[];

  staging: ProjectEnvDetails;
  production: ProjectEnvDetails;

  storage: {
    usedBytes: number;
    maxBytes: number;
  };

  /**
   * the list of forms for the project
   */
  forms: FormDetails[];
}

export interface ProjectEnvDetails {
  published: {
    userId: string;
    displayName: string;

    timestamp: Date | null;
  };

  /**
   * Url to the screenshot of the current published site
   */
  screenshot: string;

  /**
   * Tells if ssl is enabled for the domain
   */
  forceSsl: boolean;

  /**
   * Tells if hsts is enabled for the domain
   *
   * Only effective if forceSsl is true
   */
  hsts: boolean;
}
