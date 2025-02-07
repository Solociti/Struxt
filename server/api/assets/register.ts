import express from "express";
import path from "node:path";
import multer from "multer";
import fs from "node:fs";

const __dirname = path.dirname(import.meta.url);
const uploadDir = path
  .join(__dirname, "../../../uploads/projects")
  .replace("file:", "");
const saveDir = path
  .join(__dirname, "../../../uploads/temp")
  .replace("file:", "");

const upload = multer({ dest: saveDir });

// setup the static files for assets
export const staticFiles = express.static(uploadDir);

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
    const files = Array.isArray(req.files) ? req.files : [];

    /**
     * The list of uploaded files
     */
    const uploaded: { src: string }[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname);
      const newFileName = file.filename + ext;

      fs.renameSync(
        file.path,
        path.join(uploadDir, "projects", projectId, newFileName)
      );

      uploaded.push({
        src: `/assets/${projectId}/${newFileName}`,
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
