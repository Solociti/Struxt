import { CronTrigger, HttpTrigger } from "common/models/projects/Triggers";
import { Api } from "../api";
import { ProjectDetails } from "common/models/projects/ProjectDetails";

/**
 * Api that handles saving trigger configurations to the project details.
 */
export interface ProjectTriggersApi extends Api {
  Endpoint: "/api/projects/:projectId/triggers";
  EndpointParts: ["/api/projects", string, "triggers"];

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    httpTriggers?: HttpTrigger[];
    cronTriggers?: CronTrigger[];
  };
  PostResponse: {
    success: boolean;
    details: ProjectDetails;
  };
}
