import { DomainDetails } from "./Domains";
import { FormDetails } from "./Forms";

export interface ProjectDetails {
  name: string;
  description: string;

  owner: {
    userId: string;
    displayName: string;
  };

  /**
   * The list of domains for the project
   */
  domains: DomainDetails[];

  staging: {
    published: {
      userId: string;
      displayName: string;

      timestamp: number;
    };
    screenshot: string;
  };

  production: {
    published: {
      userId: string;
      displayName: string;

      timestamp: number;
    };
    screenshot: string;
  };

  /**
   * the list of forms for the project
   */
  forms: FormDetails[];
}
