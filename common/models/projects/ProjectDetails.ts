import { UserModelAction } from "../Model";
import { ProjectEnvSettings } from "./Environment";
import { FormDetails } from "./Forms";
import { ProjectModel } from "./ProjectModel";

export interface ProjectDetails {
  projectId: string;
  name: string;
  description: string;

  featureFlags: ProjectModel["featureFlags"];

  staging: ProjectEnvSettings;
  production: ProjectEnvSettings;

  publish: {
    staging: UserModelAction & { screenshotUrl: string };
    production: UserModelAction & { screenshotUrl: string };
  };

  storage: {
    usedBytes: number;
    maxBytes: number;
  };

  /**
   * the list of forms for the project
   */
  forms: FormDetails[];
}
