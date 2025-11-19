import { EditorSnapshotListItem } from "common/models/projects/EditorSnapshot";
import { Api } from "../api";

export interface EditorSnapshotListApi extends Api {
  Endpoint: "/api/projects/:projectId/snapshots";

  UrlParams: {
    projectId: string;
  };

  GetQuery: {};
  GetResponse: {
    list: EditorSnapshotListItem[];
  };
}
