import {
  EnvironmentTypes,
  validEnvironments,
} from "common/models/projects/Environment";
import { zSimpleIdValidation } from "common/models/zValidation";
import { Router } from "express";
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
    const subPath = subPathParts ? join(...subPathParts) : "";

    const siteDir = getPublishDir(
      projectId,
      env as EnvironmentTypes,
      publishId,
    );

    const handled = await serveStaticFile(siteDir, `/${subPath}`, req, res);
    if (!handled) {
      next();
    }
  },
);
