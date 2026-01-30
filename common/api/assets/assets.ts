import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { EditorAsset } from "common/models/assets/EditorAsset";
import { Api } from "../api";
import { StructuredError } from "common/custom-error/custom-error";

export interface AssetUploadApi extends Api {
  Endpoint: "/api/assets/upload/:projectId";
  EndpointParts: ["/api/assets/upload", string];

  UrlParams: {
    projectId: string;
  };

  PostBody: FormData;

  PostResponse: {
    /**
     * The list of assets that were uploaded.
     */
    assets: EditorAsset[];

    /**
     * The list of errors that occurred during the upload.
     */
    errors: StructuredError[];
  };
}

/**
 * Gets the metadata for the given asset.
 */
export interface AssetApi extends Api {
  Endpoint: "/api/assets/model/:projectId";
  EndpointParts: ["/api/assets/model", string];

  UrlParams: {
    projectId: string;
  };

  GetQuery: {
    uuid: string;
  };

  GetResponse: {
    asset: AssetModel;
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

export interface AssetCreateApi extends Api {
  Endpoint: "/api/assets/create/:projectId";
  EndpointParts: ["/api/assets/create", string];

  UrlParams: {
    projectId: string;
  };

  PostBody: Pick<AssetModel, "path">;
  PostResponse: {
    success: boolean;
    asset: AssetModel;
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

    isPermanent: boolean;
  };

  PostResponse: {
    success: boolean;
  };
}

/**
 * Get the list of assets for the given project.
 */
export interface AssetListFilesApi extends Api {
  Endpoint: "/api/assets/list-files/:projectId";
  EndpointParts: ["/api/assets/list-files", string];

  UrlParams: {
    projectId: string;
  };

  GetQuery: {};

  GetResponse: {
    files: AssetListItem[];
  };
}

export interface AssetEditEndpoint {
  Endpoint: "/assets/:projectId/:uuid";
  EndpointParts: ["/assets", string, string];

  UrlParams: {
    projectId: string;
    uuid: string;
  };

  PutBody: string;

  PutResponse: {
    success: boolean;
  };
}
