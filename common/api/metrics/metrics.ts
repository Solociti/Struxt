import { Api } from "../api";

export interface MetricsApi extends Api {
  Endpoint: "/api/metrics/:projectId";

  UrlParams: {
    projectId: string;
  };

  GetQuery: {};
  GetResponse: {
    data: {
      type: string;
      data: {
        datasets: {
          label: string;
          borderColor: string;
          tension: number;
          data: {
            x: string;
            y: number;
          }[];
        }[];
      };
    };
  };
}
