import express from "express";
import { copyFile, writeFile } from "node:fs/promises";
import path, { dirname, join } from "node:path";
import { cleanDir } from "../../utils/cleanDir";
import { getTable } from "../../utils/database";
import { mkDirRecursive } from "../../utils/mkDir";
import { getAssetDir, getSiteDir } from "../../utils/uploadDir";
import { copyDir } from "../../utils/copyDir";
import { existsSync } from "node:fs";

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

  const project = JSON.parse(row.project);

  const body: {
    projectId: string;
    type: "staging" | "production";
    files: { filename: string; content: string; mimeType: string }[];
  } = req.body;

  const siteDir = getSiteDir(body.type, projectId);
  await cleanDir(siteDir);
  await mkDirRecursive(siteDir);

  // copy the asset files to the project directory
  const assetFiles = project.assets as { src: string; type: "image" }[];
  const replaceValues: { find: string; replace: string }[] = [];

  for (const asset of assetFiles) {
    if (asset.src.startsWith("http")) {
      continue;
    }

    const basename = path.basename(asset.src);

    const srcFile = join(getAssetDir(projectId), basename);
    // check if the src file exists
    if (!existsSync(srcFile)) {
      continue;
    }

    const destFile = join(siteDir, "assets", basename);

    // replace the src string with the dest string in the project files
    replaceValues.push({
      find: asset.src,
      replace: `/assets/${basename}`,
    });

    await mkDirRecursive(dirname(destFile));
    await copyFile(srcFile, destFile);
  }

  // save the project files
  for (const file of body.files) {
    const filePath = join(siteDir, file.filename);
    await mkDirRecursive(dirname(filePath));

    let content = file.content;

    // replace the asset src values
    for (const { find, replace } of replaceValues) {
      content = content.replace(new RegExp(`["']${find}["']`, "g"), replace);
    }

    await writeFile(filePath, content, {
      encoding: "utf-8",
    });
  }

  // copy the directory of custom project files
  const customFilesDir = join(getAssetDir(projectId), "custom");
  if (existsSync(customFilesDir)) {
    await copyDir(customFilesDir, siteDir, {
      replace: true,
      preserveTimestamps: true,
    });
  }

  // Create a new project
  res.json({
    success: true,
  });
});
