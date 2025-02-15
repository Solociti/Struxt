import express from "express";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cleanDir } from "../../utils/cleanDir";
import { getTable } from "../../utils/database";
import { mkDirRecursive } from "../../utils/mkDir";
import { getSiteDir } from "../../utils/uploadDir";

export const router = express.Router();

const validTypes = ["staging", "production"];

router.post("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  // check if the project exists
  const [row] = await getTable("sites").where({
    id: projectId,
  });

  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (!validTypes.includes(req.body.type)) {
    res.status(400).json({
      success: false,
      error: `Type '${req.body.type}' not implemented!`,
    });
    return;
  }

  if (req.body.projectId !== projectId) {
    res.status(400).json({
      success: false,
      error: `Project id mismatch!`,
    });
    return;
  }

  const body: {
    projectId: string;
    type: "staging" | "production";
    files: { filename: string; content: string; mimeType: string }[];
  } = req.body;

  const siteDir = getSiteDir(body.type, projectId);
  await cleanDir(siteDir);
  await mkDirRecursive(siteDir);

  for (const file of body.files) {
    const filePath = join(siteDir, file.filename);
    await mkDirRecursive(dirname(filePath));

    await writeFile(filePath, file.content, {
      encoding: "utf-8",
    });
  }

  // Create a new project
  res.json({
    success: true,
  });
});
