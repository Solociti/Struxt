import {
  EnvironmentTypes,
  VariableState,
} from "common/models/projects/Environment";
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
  EndpointParts: ["/api/projects", string, "editor"];

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

  PostBody: {
    propPath:
      | "name"
      | "description"
      | "featureFlags.aiPilot.enabled"
      | "featureFlags.aiPilot.settings.monthlyAllowance"
      | "featureFlags.routines.enabled";
    value: string | number | boolean | null;
  };
  PostResponse: {
    success: boolean;

    details: ProjectDetails;
  };
}

export interface ProjectEnvVariablesApi extends Api {
  Endpoint: "/api/projects/:projectId/env-variables";
  EndpointParts: ["/api/projects", string, "env-variables"];

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    changes: (
      | {
          env: EnvironmentTypes;
          update: VariableState;
          ephemeralPublicKeyHex?: string;
        }
      | { env: EnvironmentTypes; remove: string }
    )[];
  };
  PostResponse: {
    success: boolean;
    details: ProjectDetails;
  };
}

export interface ProjectEnvVariableKeysApi extends Api {
  Endpoint: "/api/projects/:projectId/env-variables/public-key";
  EndpointParts: ["/api/projects", string, "env-variables/public-key"];

  UrlParams: {
    projectId: string;
  };

  GetQuery: {
    env: EnvironmentTypes;
  };
  GetResponse: {
    publicKeyHex: string;
  };
}

export interface ProjectCreateApi extends Api {
  Endpoint: "/api/projects/new";

  UrlParams: {};

  PostBody: {
    name: string;
  };

  PostResponse: {
    success: boolean;

    /**
     * The project id of the newly created project
     */
    projectId: string;

    projectItem: ProjectListItem;
  };
}
