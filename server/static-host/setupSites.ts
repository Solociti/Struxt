import { HTTPStatus } from "common/custom-error/custom-error";
import {
  EnvironmentTypes,
  validEnvironments,
} from "common/models/projects/Environment";
import { zSimpleIdValidation } from "common/models/zValidation";
import { Response, Router } from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getPublishDir } from "server/utils/uploadDir";
import z from "zod";
import { serveStaticFile } from "./serveStaticFile";

export const sitesRouter = Router();

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

    const handled = await serveStaticFile(siteDir, subPath, req, res);
    if (!handled) {
      if (!sendErrorPage(res, 404, siteDir)) {
        next();
      }
    }
  },
);

/**
 * Send an error page if it exists for the status code
 *
 * @param res
 * @param status
 * @param siteDir
 * @returns
 */
function sendErrorPage(res: Response, status: HTTPStatus, siteDir: string) {
  // check if the site has a custom error page
  if (existsSync(join(siteDir, `${status}.html`))) {
    res.status(status).sendFile(join(siteDir, `${status}.html`));
    return true;
  }

  if (status === 404) {
    res.status(404).render("error", {
      statusCode: 404,
      title: "Page Not Found",
      message: "The page you are looking for does not exist.",
    });
    return true;
  }

  return false;
}
