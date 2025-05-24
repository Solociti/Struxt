import { Api } from "../api";

export interface ProjectInvitesApi extends Api {
  Endpoint: "/api/projects/invites/:inviteId";

  UrlParams: {
    inviteId: string;
  };

  GetQuery: {};
  GetResponse: {};

  PostBody: {};
  PostResponse: {
    success: boolean;
  };

  DeleteQuery: {};
  DeleteResponse: {
    success: boolean;
  };
}
