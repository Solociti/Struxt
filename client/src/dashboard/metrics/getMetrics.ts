import { callApi } from "client/api/api";
import { MetricsApi } from "common/api/metrics/metrics";

export async function getMetrics(projectId: string) {
  const response: MetricsApi["GetResponse"] = await callApi(
    ["/api/metrics", projectId],
    {
      method: "GET",
    }
  );

  return response.data;
}
