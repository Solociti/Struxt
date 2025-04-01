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

  staging: {
    published: {
      userId: string;
      displayName: string;

      timestamp: Date | null;
    };
    screenshot: string;
  };

  production: {
    published: {
      userId: string;
      displayName: string;

      timestamp: Date | null;
    };
    screenshot: string;
  };

  /**
   * the list of forms for the project
   */
  forms: FormDetails[];
}
