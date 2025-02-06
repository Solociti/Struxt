import express from "express";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { mkDirRecursive } from "../../utils/mdDir";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const __dirname = path.dirname(import.meta.url);
const uploadDir = path
  .join(__dirname, "../../../uploads/projects")
  .replace("file:", "");

export const router = express.Router();

router.get("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  const filePath = path.join(uploadDir, projectId, "project.json");

  const exists = fs.existsSync(filePath);
  if (!exists) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const contents = await readFile(filePath, {
    encoding: "utf8",
  });
  const project = JSON.parse(contents);

  // Return the list of projects
  res.json({ project });
});

router.post("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  const filePath = path.join(uploadDir, projectId, "project.json");

  const data = JSON.stringify(req.body.project, null, 2);

  await mkDirRecursive(path.dirname(filePath));

  await writeFile(filePath, data, {
    encoding: "utf8",
  });

  // Create a new project
  // req.body contains the project data
  res.json({
    success: true,
  });
});
