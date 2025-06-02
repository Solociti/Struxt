import { ProjectRoleVisualDocument } from "common/models/projects/ProjectRoles";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
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

  DeleteQuery: {
    userId: string;
  };

  DeleteResponse: {
    success: boolean;
  };
}

export interface ProjectRolesInviteApi extends Api {
  Endpoint: "/api/projects/:projectId/roles/invite";

  UrlParams: {
    projectId: string;
  };

  GetParams: {};

  GetResponse: {
    list: ProjectRolesInviteModel[];
  };

  PostBody: {
    email: string;
    roles: ProjectRoleTypes[];
    message: string;
  };
  PostResponse: {
    success: boolean;

    invite: object;
  };

  DeleteQuery: {
    inviteId: string;
  };
  DeleteResponse: {
    success: boolean;
  };
}
