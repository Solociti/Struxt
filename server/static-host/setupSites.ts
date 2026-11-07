import { HTTPStatus } from "common/custom-error/custom-error";
import {
  EnvironmentTypes,
  validEnvironments,
} from "common/models/projects/Environment";
import { zSimpleIdValidation } from "common/models/zValidation";
import { Request, Response, Router } from "express";
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

    const code = await serveStaticFile(siteDir, subPath, req, res);
    if (typeof code === "number") {
      if (!sendErrorPage(res, req, code, siteDir)) {
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
async function sendErrorPage(
  res: Response,
  req: Request,
  status: HTTPStatus,
  siteDir: string,
) {
  res.status(status);

  // check if the site has a custom error page
  const notFoundStatus = await serveStaticFile(
    siteDir,
    `/${status}.html`,
    req,
    res,
  );

  if (typeof notFoundStatus === "boolean" && notFoundStatus) {
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
