import { EditorAsset } from "common/models/assets/EditorAsset";
import { Api } from "../api";

export interface AssetApi extends Api {
  Endpoint: "/api/assets/upload/:projectId";
  EndpointParts: ["/api/assets/upload", string];

  UrlParams: {
    projectId: string;
  };

  PostBody: FormData;

  PostResponse: {
    assets: EditorAsset[];
  };
}

export interface AssetSaveExternalApi extends Api {
  Endpoint: "/api/assets/save-external-asset/:projectId";
  EndpointParts: ["/api/assets/save-external-asset", string];

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    assetSrc: string;
  };

  PostResponse: {
    success: boolean;
    asset: EditorAsset;
  };
}

export interface AssetDeleteApi extends Api {
  Endpoint: "/api/assets/delete/:projectId";
  EndpointParts: ["/api/assets/delete", string];

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    assets: { uuid: string }[];
  };

  PostResponse: {
    success: boolean;
  };
}
