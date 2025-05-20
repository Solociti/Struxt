import { ProjectRoleVisualDocument } from "common/models/projects/ProjectRoles";
import { ProjectRoleTypes } from "common/models/user/Roles";
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
    /**
     * The user this update is for
     */
    userId: string;

    roles: ProjectRoleTypes[];
  };

  PostResponse: {
    success: boolean;

    item: ProjectRoleVisualDocument;
  };
}
