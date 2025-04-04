import { EnvironmentTypes } from "./Environment";

export interface DomainDetails {
  id: number;

  /**
   * The base domain name
   *
   * @example example.com
   * @example staging.example.com
   */
  domain: string;

  /**
   * the environment the domain is for
   */
  environment: EnvironmentTypes;

  /**
   * Tells if ssl is enabled for the domain
   */
  ssl: boolean;
}

export class DomainModel {
  id: number = 0;

  /**
   * The base domain name
   *
   * @example example.com
   * @example staging.example.com
   */
  domain: string = "";

  /**
   * The project id this domain is for
   */
  siteId: number = 0;

  updated: {
    userId: string;
    displayName: string;

    /**
     * The timestamp of the update
     */
    timestamp: number;
  } = {
    userId: "",
    displayName: "",
    timestamp: 0,
  };

  created: {
    timestamp: number;
  } = {
    timestamp: 0,
  };

  /**
   * Tells if the domain is an active domain.
   */
  enabled: boolean = false;

  /**
   * For production domain, tells if it is the primary domain
   */
  isPrimary: boolean = false;

  /**
   * Tells if ssl is enabled for the domain
   */
  ssl: boolean = true;

  /**
   * the email used to register the ssl cert with letsencrypt
   */
  sslEmail: string = "";
}
