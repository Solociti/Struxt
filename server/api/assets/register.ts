import { customError } from "common/custom-error/custom-error";
import { roles } from "common/models/user/Roles";
import express from "express";
import multer from "multer";
import { existsSync, realpathSync, renameSync } from "node:fs";
import { basename, extname, join, normalize, relative, sep } from "node:path";
import { protectEndpoint } from "../../auth/protectEndpoint";
import { mkDirRecursive } from "../../utils/mkDir";
import {
  getAssetDir,
  getProjectFilesDir,
  getProjectsParentDir,
  getUploadDir,
} from "../../utils/uploadDir";
import { userFromReq } from "../auth/userFromReq";

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
      "Forbidden"
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
    const projectId = req.params.projectId;
    const files = Array.isArray((req as any).files) ? (req as any).files : [];

    const user = await userFromReq(req);
    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
        "Forbidden"
      );
    }

    /**
     * The list of uploaded files
     */
    const uploaded: { src: string }[] = [];

    await mkDirRecursive(join(projectsParentDir, projectId));

    for (const file of files) {
      const ext = extname(file.originalname);
      const originalName = basename(file.originalname, ext);

      let newFileName = originalName + ext;
      let count = 0;

      // check if the file already exists
      // if it does, add a number to the end of the file name
      while (existsSync(join(getAssetDir(projectId), newFileName))) {
        count++;
        newFileName = `${originalName}-${count}${ext}`;
      }

      renameSync(file.path, join(getAssetDir(projectId), newFileName));

      uploaded.push({
        src: `/assets/${projectId}/${newFileName}`,
      });

      // save the asset to database
      // getTable("site_assets").insert({
      //   file_path: `/assets/${projectId}/${newFileName}`,
      //   original_name: file.originalname,
      //   site_id: projectId,
      //   updated_by: "1",
      // });
    }

    res.json(uploaded);
  }
);

router.delete("/", async (req, res) => {
  // Handle the deletion of assets
  // req.body contains the list of assets to delete
  res.json({});
});
