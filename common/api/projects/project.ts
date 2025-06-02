import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { ProjectListItem } from "common/models/projects/ProjectItem";
import { Api } from "../api";

export interface ProjectListApi extends Api {
  Endpoint: "/api/projects";

  UrlParams: {};

  GetQuery: {};
  GetResponse: {
    list: ProjectListItem[];
  };
}

export interface ProjectEditorApi extends Api {
  Endpoint: "/api/projects/:projectId/editor";
  UrlParams: {
    projectId: string;
  };

  GetQuery: {};
  GetResponse: {
    /**
     * The project id loaded
     */
    projectId: string;

    /**
     * The project display name
     */
    name: string;

    /**
     * The project editor data
     */
    editorData: object;
  };

  PostBody: {
    projectId: string;
    editorData: object;
  };
  PostResponse: {
    success: boolean;
  };
}

export interface ProjectDetailsApi extends Api {
  Endpoint: "/api/projects/:projectId/details";
  UrlParams: {
    projectId: string;
  };

  GetQuery: {};
  GetResponse: {
    /**
     * The project details
     */
    details: ProjectDetails;
  };
}
