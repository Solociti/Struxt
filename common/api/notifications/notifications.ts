import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import { Api } from "../api";

export interface NotificationsApi extends Api {
  Endpoint: "/api/notifications";

  UrlParams: {};

  GetQuery: {};
  GetResponse: {
    /**
     * TODO: Not implemented yet
     */
    list: any[];

    /**
     * A list of project invites for the current user
     */
    invites: ProjectRolesInviteModel[];
  };
}
