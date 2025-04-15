import { roles } from "../user/Roles";
import { EnvironmentTypes } from "./Environment";

/**
 * @deprecated
 */
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

  isPrimary: boolean;
}

/**
 * @deprecated
 */
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
   *
   * @readonly
   */
  siteId: number = 0;

  updated: {
    userId: string;
    displayName: string;

    /**
     * The timestamp of the update
     */
    timestamp: Date;
  } = {
    userId: "",
    displayName: "",
    timestamp: new Date(),
  };

  created: {
    timestamp: Date;
  } = {
    timestamp: new Date(),
  };

  /**
   * Tells if the domain is an active domain.
   */
  enabled: boolean = false;

  /**
   * For production domain, tells if it is the primary domain
   */
  isPrimary: boolean = false;

  constructor(data?: Partial<DomainModel>) {
    if (data) {
      this.update(data);
    }
  }

  /**
   * Update this model from the given data
   *
   * @param data
   */
  update(data: Partial<DomainModel>) {
    Object.assign(this, data);
  }

  static permissions() {
    return [
      {
        props: ["enabled", "sslEmail"],
        permissions: [roles.struxt.admin],
      },
      {
        props: ["hsts", "isPrimary"],
        permissions: [
          roles.projects.edit,
          roles.projects.admin,
          roles.struxt.admin,
        ],
      },
    ];
  }
}
