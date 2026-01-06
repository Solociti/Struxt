import { RoutineListItem, RoutineModel } from "common/models/routines/Routine";
import { Api } from "../api";

export interface RoutinesFilesListApi extends Api {
  Endpoint: "/api/routines/:projectId/list";
  EndpointParts: ["/api/routines", string, "list"];

  UrlParams: {
    projectId: string;
  };

  GetQuery: {};

  GetResponse: {
    list: RoutineListItem[];
  };
}

export interface RoutinesFilesCreateApi extends Api {
  Endpoint: "/api/routines/:projectId/create-file";
  EndpointParts: ["/api/routines", string, "create-file"];

  UrlParams: {
    projectId: string;
  };

  PostBody: Pick<RoutineModel, "name" | "path"> &
    Partial<Pick<RoutineModel, "contents">>;

  PostResponse: {
    success: boolean;

    item: RoutineListItem;
  };
}

export interface RoutinesFilesEditApi extends Api {
  Endpoint: "/api/routines/:projectId/file";
  EndpointParts: ["/api/routines", string, "file"];

  UrlParams: {
    projectId: string;
  };

  GetQuery: {
    uuid: string;
  };

  GetResponse: {
    routine: RoutineModel;
  };

  PostBody: {
    routine: RoutineModel;
  };
  PostResponse: {
    success: boolean;

    routine: RoutineModel;
  };
}
