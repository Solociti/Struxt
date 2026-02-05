import { AssetUploadApi } from "common/api/assets/assets";
import { customError, structureError } from "common/custom-error/custom-error";
import { AssetModel } from "common/models/assets/AssetModel";
import { EditorAsset } from "common/models/assets/EditorAsset";
import { roles } from "common/models/user/Roles";
import { getFileType } from "common/path/FileExtensions";
import express from "express";
import multer from "multer";
import { existsSync, realpathSync } from "node:fs";
import { lstat, rename, unlink } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";
import { pipeline } from "node:stream/promises";
import { isPathInside } from "server/hfs/path";
import { hfsWriteFileStream } from "server/hfs/writeFile";
import { createSimpleId } from "server/utils/createId";
import z from "zod";
import { protectEndpoint } from "../../auth/protectEndpoint";
import { mkDirRecursive } from "../../utils/mkDir";
import {
  getAssetDir,
  getProjectFilesDir,
  getUploadDir,
} from "../../utils/uploadDir";
import { userFromReq } from "../auth/userFromReq";
import { getProjectDiskUsage } from "../projects/projectDiskUsage";
import "./apiRegister";
import { getAsset } from "./getAssets";
import { saveAsset } from "./saveAsset";

/**
 * Router for serving project files with permission checks
 */
export const assetFilesRouter = express.Router();

assetFilesRouter.use(protectEndpoint([roles.struxt.editor]));

assetFilesRouter.get("/:projectId/*filePath", async (req, res) => {
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
  if (!isPathInside(requestedFile, projectFilesDir)) {
    throw customError(400, "Invalid file path.");
  }

  // check if the file exists before symlink checks,
  // as symlinks would throw a 500 error if the file doesn't exist
  if (!existsSync(requestedFile)) {
    throw customError(404, "File not found.");
  }

  // protect against symlink attacks
  const realRequestedFile = realpathSync(requestedFile);
  if (!isPathInside(realRequestedFile, projectFilesDir)) {
    throw customError(400, "Invalid file path.");
  }

  const ext = extname(requestedFile);

  switch (getFileType(ext)) {
    case "image":
    case "video":
    case "audio":
    case "document":
      res.setHeader("Cache-Control", "private, max-age=7200");
      break;

    case "text":
    default:
      res.setHeader("Cache-Control", "private, no-cache");
      break;
  }

  res.sendFile(requestedFile, {
    dotfiles: "allow",
  });
});

// update the file contents based on the posted text contents
assetFilesRouter.put("/:projectId/:uuid", async (req, res) => {
  const { projectId, uuid } = z
    .object({ projectId: z.string(), uuid: z.string() })
    .parse(req.params);

  const user = await userFromReq(req);
  if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
    throw customError(
      403,
      "You do not have permission to modify this project.",
      "Forbidden",
    );
  }

  // get the asset
  const asset = await getAsset(uuid, projectId);
  if (!asset) {
    throw customError(404, "Asset not found.");
  }

  if (asset.isExternalSrc) {
    throw customError(400, "Cannot update external assets.");
  }

  // Check if the storage is available using the client advertised upload size
  const storage = await getProjectDiskUsage(projectId);
  const fileSize = parseInt(req.get("content-length") || "0");
  const fileSizeDiff = fileSize - asset.size;

  if (!(await storage.hasSpaceAvailable(fileSizeDiff))) {
    throw customError(400, "Storage quota exceeded.");
  }

  const projectFilesDir = getProjectFilesDir(projectId);
  const filePath = join(projectFilesDir, asset.path);

  await storage.reserveSpace(filePath, asset.size, fileSize);

  const writeStream = await hfsWriteFileStream(filePath, {
    restrictedTo: projectFilesDir,
  });

  await pipeline(req, writeStream);
  await storage.clearReservation(filePath);

  const stats = await lstat(filePath);

  asset.updated = {
    ...asset.updated,
    date: Math.floor(Date.now() / 1000),
    userId: user.id,
    displayName: user.name,
  };
  asset.size = stats.size;
  const success = await saveAsset(asset);

  res.json({
    success,
  });
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

// setup multer for file uploads using form data
const saveDir = getUploadDir("temp");

const upload = multer({
  dest: saveDir,
  limits: { fileSize: 50 * 1024 * 1024, files: 25 },
});

router.post(
  "/upload/:projectId",
  async (req, res, next) => {
    try {
      const projectId = req.params.projectId as string;

      // check if the user has permission to edit the project
      const user = await userFromReq(req);
      if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
        throw customError(
          403,
          "You do not have permission to modify this project.",
          "Forbidden",
        );
      }

      // check if the project has enough storage
      const storage = await getProjectDiskUsage(projectId);
      if (!(await storage.hasSpaceAvailable(0))) {
        throw customError(400, "Storage quota exceeded.");
      }

      next();
    } catch (err) {
      next(err);
    }
  },
  upload.array("files", 25),
  async (req, res) => {
    const projectId = req.params.projectId as string;
    const files: Express.Multer.File[] = Array.isArray((req as any).files)
      ? (req as any).files
      : [];

    const user = await userFromReq(req);

    /**
     * The list of uploaded files
     */
    const uploaded: EditorAsset[] = [];
    const errors: Error[] = [];

    await mkDirRecursive(getProjectFilesDir(projectId));
    const storage = await getProjectDiskUsage(projectId);

    for (const file of files) {
      let renamed = false;
      let saved = false;
      let newFilePath = "";

      try {
        // TODO: sanitize the file name, checking for length and invalid characters
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

        if (!(await storage.hasSpaceAvailable(file.size))) {
          throw customError(400, "Storage quota exceeded.");
        }
        await storage.reserveSpace(newFilePath, 0, file.size);

        await rename(file.path, newFilePath);
        renamed = true;

        const uuid = await createSimpleId("asset");
        const asset = new AssetModel({
          uuid,
          projectId: projectId,
          path: `/public/assets/${newFileName}`,
          displayName: newFileName,
          isExternalSrc: false,
          size: file.size,
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

        saved = await saveAsset(asset);

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
          err.message = `(File: ${file.originalname}) ${err.message}`;
          errors.push(err);
        }
      }

      if (newFilePath) {
        try {
          // clear the file storage reservation
          await storage.clearReservation(newFilePath);
        } catch {
          // ignore error. It'll clear on the ttl
        }
      }
    }

    // throw if all files failed
    if (errors.length > 0 && errors.length === files.length) {
      throw errors[0];
    }

    const response: AssetUploadApi["PostResponse"] = {
      assets: uploaded,
      errors: errors.map(structureError),
    };

    res.json(response);
  },
);
