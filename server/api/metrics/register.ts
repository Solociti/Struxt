import { MetricsApi } from "common/api/metrics/metrics";
import { customError } from "common/custom-error/custom-error";
import { formatDate } from "common/format/date";
import { roles } from "common/models/user/Roles";
import { registerApi } from "../registerApi";

registerApi<MetricsApi>("/api/metrics/:projectId").get(
  [roles.struxt.metrics, roles.struxt.admin],
  async ({ user, params }) => {
    const { projectId } = params;

    if (
      !user.hasProjectPermission(projectId, [
        roles.projects.metrics,
        roles.projects.admin,
      ]) &&
      !user.hasPermission([roles.struxt.admin])
    ) {
      throw customError(
        403,
        "You do not have permission to access this resource"
      );
    }

    // get the metrics from victoria metrics
    const query = `sum(increase(struxt_site_requests{project_id="${projectId}"}[15m])) by (path)`;
    const metrics = await getMetrics(query, "-12h", "15m");

    // convert the metrics for chart.js

    const datasets = metrics.map((metric) => {
      return {
        label: metric.metric.path || "Page Views",
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        data: metric.values.map(([key, value]) => {
          return { x: formatDate(key, true), y: parseFloat(value) };
        }),
      };
    });

    const cfg = {
      type: "line",
      data: {
        datasets,
      },
    };

    return {
      data: cfg,
    };
  }
);

interface VictoriaMetricsResponse {
  status: string;
  data: {
    resultType: string;

    result: Array<{
      metric: Record<string, string>;
      values: [number, string][];
    }>;
  };

  stats: {
    seriesFetched: number;
    executionTimeMsec: number;
  };
}

/**
 * Get the metrics from victoria metrics
 *
 * @param query
 * @param startOffset
 * @param step
 * @returns
 */
async function getMetrics(query: string, startOffset: string, step: string) {
  const url = new URL(
    "/prometheus/api/v1/query_range",
    "http://victoriametrics:8428"
  );

  url.searchParams.set("query", query);
  url.searchParams.set("start", startOffset);
  url.searchParams.set("step", step);

  const response = await fetch(url);
  const data: VictoriaMetricsResponse = await response.json();

  if (data.status !== "success") {
    throw customError(500, "Failed to get metrics");
  }

  return data.data.result;
}
