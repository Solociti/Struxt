import express from "express";
import multer from "multer";
import { existsSync, renameSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { getTable } from "../../utils/database";
import { mkDirRecursive } from "../../utils/mkDir";
import { getUploadDir } from "../../utils/uploadDir";

// Get the upload directory
const uploadDir = getUploadDir("projects");
const saveDir = getUploadDir("temp");

const upload = multer({ dest: saveDir });

// setup the static files for assets
export const staticFiles = express.static(uploadDir, {
  setHeaders: (res) => {
    // cache the assets for 7 days
    res.setHeader("Cache-Control", "public, max-age=604000");
  },
});

// setup a api endpoint for assets
export const router = express.Router();

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

    /**
     * The list of uploaded files
     */
    const uploaded: { src: string }[] = [];

    await mkDirRecursive(join(uploadDir, projectId));

    for (const file of files) {
      const ext = extname(file.originalname);
      const originalName = basename(file.originalname, ext);

      let newFileName = originalName + ext;
      let count = 0;

      // check if the file already exists
      // if it does, add a number to the end of the file name
      while (existsSync(join(uploadDir, projectId, newFileName))) {
        count++;
        newFileName = `${originalName}-${count}${ext}`;
      }

      renameSync(file.path, join(uploadDir, projectId, newFileName));

      uploaded.push({
        src: `/assets/${projectId}/${newFileName}`,
      });

      // save the asset to database
      getTable("assets").insert({
        file_path: `/assets/${projectId}/${newFileName}`,
        original_name: file.originalname,
        site_id: projectId,
        updated_by: "1",
      });
    }

    res.json(uploaded);
  }
);

router.delete("/", async (req, res) => {
  // Handle the deletion of assets
  // req.body contains the list of assets to delete
  res.json({});
});
