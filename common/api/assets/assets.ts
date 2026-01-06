import { Api } from "../api";

export interface AssetApi extends Api {
  Endpoint: "/api/assets/upload/:projectId";
  EndpointParts: ["/api/assets/upload", string];

  UrlParams: {
    projectId: string;
  };

  PostBody: FormData;

  PostResponse: {
    assets: {
      src: string;
    }[];
  };
}

export interface AssetDeleteApi extends Api {
  Endpoint: "/api/assets/delete/:projectId";
  EndpointParts: ["/api/assets/delete", string];

  UrlParams: {
    projectId: string;
  };

  PostBody: {
    assets: {
      type: string;
      src: string;
    }[];
  };

  PostResponse: {
    success: boolean;
  };
}
