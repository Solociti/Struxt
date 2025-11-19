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

  PostBody: {
    snapshotTime: number;
    eventType: EditorSnapshotListItem["eventType"];

    update: {
      key: "locked.active";
      value: boolean;
    };
  };
  PostResponse: {
    success: boolean;
    item: EditorSnapshotListItem;
  };
}

export interface EditorSnapshotRestoreApi extends Api {
  Endpoint: "/api/projects/:projectId/snapshots/restore";

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    snapshotTime: number;
    eventType: EditorSnapshotListItem["eventType"];
  };
  PostResponse: {
    success: boolean;
    item: EditorSnapshotListItem;
  };
}
