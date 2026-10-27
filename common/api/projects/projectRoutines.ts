import { ProjectFeatureFlags } from "common/models/projects/ProjectModel";
import { Api } from "../api";
import { ProjectDetailsApi } from "./project";

export interface ProjectRoutinesEnvApi extends Api {
  Endpoint: "/api/projects/:projectId/routines/env";
  EndpointParts: ["/api/projects", string, "routines/env"];

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    item: ProjectFeatureFlags["routines"]["environments"][number];
  };
  PostResponse: ProjectDetailsApi["GetResponse"];

  DeleteQuery: {
    uuid: string;
  };
  DeleteResponse: ProjectDetailsApi["GetResponse"];
}
