import { EnvironmentTypes } from "common/models/projects/Environment";
import { Api } from "../api";

export interface PublishApi extends Api {
  Endpoint: "/api/publish/:projectId";

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    projectId: string;

    type: EnvironmentTypes;

    files: { filename: string; content: string; mimeType: string }[];
  };

  PostResponse: {
    success: boolean;

    publishId: string;

    /**
     * The list of domains that were published to.
     */
    domains: string[];

    /**
     * The primary domain that was published to.
     */
    primaryDomain: string;
  };
}
