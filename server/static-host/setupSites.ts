import {
  EnvironmentTypes,
  validEnvironments,
} from "common/models/projects/Environment";
import { setupPublishedProjectStaticConfig } from "common/models/projects/PublishedProjectStaticConfig";
import { zSimpleIdValidation } from "common/models/zValidation";
import { Router } from "express";
import httpProxy from "http-proxy-node16";
import { join } from "node:path";
import { match } from "path-to-regexp";
import { hfsReadFile } from "server/hfs/readFile";
import { getPublishDir } from "server/utils/uploadDir";
import z from "zod";
import { serveStaticFile } from "./serveStaticFile";

export const sitesRouter = Router();

const proxy = httpProxy.createProxyServer({
  ignorePath: true,
});

const fissionBaseUrl = (() => {
  const url = process.env.FISSION_SERVER_URL;

  if (!url) {
    console.warn(
      "FISSION_SERVER_URL not set, published project http triggers will not work.",
    );
    return null;
  }

  try {
    z.url().parse(url);
    return url;
  } catch (err) {
    console.warn(
      `FISSION_SERVER_URL value '${url}' is not a valid URL, published project http triggers will not work.`,
    );
    return null;
  }
})();

sitesRouter.use(
  "/sites/:projectId/:env/:publishId{/*subPath}",
  async (req, res, next) => {
    let projectId, env, publishId;

    try {
      const params = z
        .object({
          projectId: zSimpleIdValidation(),
          env: z.enum(validEnvironments),
          publishId: zSimpleIdValidation(),
        })
        .parse(req.params);

      projectId = params.projectId;
      env = params.env;
      publishId = params.publishId;
    } catch (_err) {
      next();
      return;
    }

    const subPathParts = (req.params as any).subPath as string[];
    const subPath = subPathParts ? join("/", ...subPathParts) : "/";
    const method = req.method.toUpperCase() as
      | "GET"
      | "POST"
      | "PUT"
      | "DELETE"
      | "PATCH";

    const siteDir = getPublishDir(
      projectId,
      env as EnvironmentTypes,
      publishId,
    );

    const config = await getProjectStaticConfig(projectId, env, publishId);

    if (fissionBaseUrl) {
      for (const endpoint of config.endpoints) {
        if (endpoint.method !== method) {
          continue;
        }

        const matcher = match(endpoint.httpTrigger, {
          decode: decodeURIComponent,
        });
        const matched = matcher(subPath);

        if (matched && endpoint.fissionEndpoint) {
          const originalUrl = new URL(req.originalUrl, "http://localhost");
          const endpointUrl = new URL(endpoint.fissionEndpoint, fissionBaseUrl);

          endpointUrl.search = originalUrl.search;

          proxy.web(req, res, { target: endpointUrl.toString() }, (err) => {
            console.error(
              "Error proxying request to fission endpoint:",
              { routineUuid: endpoint.routineUuid },
              err,
            );
            res.status(502).send("Bad Gateway");
          });

          return;
        }
      }
    }

    const handled = await serveStaticFile(siteDir, subPath, req, res);
    if (!handled) {
      next();
    }
  },
);

/**
 * Get the static config for a published project.
 *
 * @param projectId
 * @param env
 * @param publishId
 * @returns
 */
async function getProjectStaticConfig(
  projectId: string,
  env: EnvironmentTypes,
  publishId: string,
) {
  const siteDir = getPublishDir(projectId, env, publishId);
  const configPath = join(siteDir, ".config.json");

  try {
    const contents = (await hfsReadFile(configPath, {
      encoding: "utf-8",
    })) as string;

    if (contents) {
      const config = JSON.parse(contents);
      return setupPublishedProjectStaticConfig(config);
    }
  } catch (err) {}

  return setupPublishedProjectStaticConfig({
    publishUuid: publishId,
  });
}
