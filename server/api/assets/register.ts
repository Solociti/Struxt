import {
  AssetApi,
  AssetDeleteApi,
  AssetSaveExternalApi,
} from "common/api/assets/assets";
import { customError } from "common/custom-error/custom-error";
import { AssetModel } from "common/models/assets/AssetModel";
import { EditorAsset } from "common/models/assets/EditorAsset";
import { roles } from "common/models/user/Roles";
import express from "express";
import multer from "multer";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { rename, unlink } from "node:fs/promises";
import { basename, extname, join, normalize, relative, sep } from "node:path";
import { createSimpleId } from "server/utils/createId";
import z from "zod";
import { protectEndpoint } from "../../auth/protectEndpoint";
import { mkDirRecursive } from "../../utils/mkDir";
import {
  getAssetDir,
  getProjectFilesDir,
  getProjectsParentDir,
  getUploadDir,
} from "../../utils/uploadDir";
import { userFromReq } from "../auth/userFromReq";
import { registerApi } from "../registerApi";
import { deleteAsset } from "./deleteAsset";
import { saveAsset } from "./saveAsset";

const projectsParentDir = getProjectsParentDir();
const saveDir = getUploadDir("temp");

const upload = multer({ dest: saveDir });

/**
 * Router for serving project files with permission checks
 */
export const staticFilesRouter = express.Router();

staticFilesRouter.use(protectEndpoint([roles.struxt.editor]));

staticFilesRouter.get("/:projectId/*filePath", async (req, res) => {
  const projectId = req.params.projectId;
  const pathParts = (req.params as any).filePath as string[];

  const user = await userFromReq(req);
  if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
    throw customError(
      403,
      "You do not have permission to access this project.",
      "Forbidden",
    );
  }

  const projectFilesDir = getProjectFilesDir(projectId);
  const requestedFile = normalize(join(projectFilesDir, ...pathParts));

  // check for path traversal attacks.
  // Path-to-RegExp in express should already catch this, but just in case.
  const relativePath = relative(projectFilesDir, requestedFile);
  if (relativePath.startsWith("..")) {
    throw customError(400, "Invalid file path.");
  }

  // check if the file exists before symlink checks,
  // as symlinks would throw a 500 error if the file doesn't exist
  if (!existsSync(requestedFile)) {
    throw customError(404, "File not found.");
  }

  // protect against symlink attacks
  const realRequestedFile = realpathSync(requestedFile);
  if (!realRequestedFile.startsWith(`${projectFilesDir}${sep}`)) {
    throw customError(400, "Invalid file path.");
  }

  res.setHeader("Cache-Control", "public, max-age=604000");
  res.sendFile(requestedFile);
});

/**
 * Router for asset upload and management endpoints
 */
export const router = express.Router();

router.use(protectEndpoint(["struxt.editor"]));

router.get("/", async (req, res) => {
  // Return the list of assets
  res.json([]);
});

router.post(
  "/upload/:projectId",
  upload.array("files", 25),
  async (req, res) => {
    const projectId = req.params.projectId as string;
    const files = Array.isArray((req as any).files) ? (req as any).files : [];

    const user = await userFromReq(req);
    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
        "Forbidden",
      );
    }

    /**
     * The list of uploaded files
     */
    const uploaded: EditorAsset[] = [];
    const errors: Error[] = [];

    await mkDirRecursive(join(projectsParentDir, projectId));

    for (const file of files) {
      let renamed = false;
      let saved = false;
      let newFilePath = "";

      try {
        const ext = extname(file.originalname);
        const originalName = basename(file.originalname, ext);

        let newFileName = originalName + ext;
        newFilePath = join(getAssetDir(projectId), newFileName);
        let count = 0;

        // check if the file already exists
        // if it does, add a number to the end of the file name
        while (existsSync(newFilePath) && count < 1000) {
          count++;
          newFileName = `${originalName}-${count}${ext}`;
          newFilePath = join(getAssetDir(projectId), newFileName);
        }

        const stats = await lstatSync(file.path);

        await rename(file.path, newFilePath);
        renamed = true;

        const uuid = await createSimpleId("asset");
        const asset = new AssetModel({
          uuid,
          projectId: projectId,
          path: `/assets/${newFileName}`,
          displayName: newFileName,
          isExternalSrc: false,
          size: stats.size,
          created: {
            date: Math.floor(Date.now() / 1000),
            userId: user.id,
            displayName: user.name,
          },
          updated: {
            date: Math.floor(Date.now() / 1000),
            userId: user.id,
            displayName: user.name,
          },
        });

        await saveAsset(asset);
        saved = true;

        uploaded.push(asset.getEditorAsset());
      } catch (err: Error | unknown) {
        if (renamed && !saved) {
          await unlink(newFilePath).catch((err) => {
            console.error("Failed to cleanup temp file:", err);
          });
        } else if (!renamed) {
          await unlink(file.path).catch((err) => {
            console.error("Failed to cleanup temp file:", err);
          });
        }

        if (err instanceof Error) {
          errors.push(err);
        }
      }
    }

    if (errors.length > 0 && errors.length === files.length) {
      throw errors[0];
    }

    const response: AssetApi["PostResponse"] = {
      assets: uploaded,
    };

    res.json(response);
  },
);

registerApi<AssetSaveExternalApi>(
  "/api/assets/save-external-asset/:projectId",
).post([roles.struxt.editor], async ({ body, user, params }) => {
  const { projectId } = z
    .object({
      projectId: z.string(),
    })
    .parse(params);

  const { assetSrc } = z
    .object({
      assetSrc: z.string().startsWith("https://"),
    })
    .parse(body);

  // check if the user has permission to edit the project
  if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
    throw customError(
      403,
      "You do not have permission to modify this project.",
    );
  }

  const uuid = await createSimpleId("asset");
  const asset = new AssetModel({
    uuid,
    projectId,
    path: assetSrc,
    displayName: AssetModel.getFileName(assetSrc),
    isExternalSrc: true,
    size: 0,
    created: {
      date: Math.floor(Date.now() / 1000),
      userId: user.id,
      displayName: user.name,
    },
    updated: {
      date: Math.floor(Date.now() / 1000),
      userId: user.id,
      displayName: user.name,
    },
  });
  const success = await saveAsset(asset);

  if (!success) {
    throw customError(500, "Failed to save asset.");
  }

  return {
    success,
    asset: asset.getEditorAsset(),
  };
});

registerApi<AssetDeleteApi>("/api/assets/delete/:projectId").post(
  [roles.struxt.editor],
  async ({ params, user, body }) => {
    const { projectId } = z
      .object({
        projectId: z.string(),
      })
      .parse(params);

    // check if the user has permission to edit the project
    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
      );
    }

    // parse the body
    const { assets } = z
      .object({
        assets: z.array(
          z.object({
            uuid: z.string(),
          }),
        ),
      })
      .parse(body);

    for (const asset of assets) {
      await deleteAsset(asset.uuid, projectId, {
        userId: user.id,
        displayName: user.name,
      });
    }

    return {
      success: true,
    };
  },
);
