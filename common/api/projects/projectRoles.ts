import { ProjectRoleVisualDocument } from "common/models/projects/ProjectRoles";
import { Api } from "../api";

export interface ProjectRolesApi extends Api {
  Endpoint: "/api/projects/:projectId/roles";

  UrlParams: {
    projectId: string;
  };

  GetQuery: {};
  GetResponse: {
    list: ProjectRoleVisualDocument[];
  };

  PostBody: {
    userId: string;

    role: string;
  };

  PostResponse: {
    success: boolean;

    item: ProjectRoleVisualDocument;
  };
}
