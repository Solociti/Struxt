import express from "express";
import { existsSync } from "node:fs";
import { copyFile, writeFile } from "node:fs/promises";
import path, { dirname, join } from "node:path";
import { customError } from "../../../common/custom-error/custom-error.ts";
import { getFormValidationFromProject } from "../../forms/getFormValidationFromProject.ts";
import { saveValidationData } from "../../forms/saveValidationData.ts";
import {
  defaultFormSettings,
  saveNewFormSettings,
} from "../../forms/sendEmail/saveFormSettings.ts";
import { getFormSettings } from "../../forms/settings/getFormSettings.ts";
import { cleanDir } from "../../utils/cleanDir.ts";
import { copyDir } from "../../utils/copyDir.ts";
import { getTable } from "../../utils/database.ts";
import { mkDirRecursive } from "../../utils/mkDir.ts";
import { getAssetDir, getSiteDir } from "../../utils/uploadDir.ts";
import { userFromReq } from "../auth/userFromReq.ts";

export const router = express.Router();

const validTypes = ["staging", "production"];

router.post("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  const user = await userFromReq(req);
  if (!user.hasPermission(`struxt.projects.${projectId}`)) {
    throw customError(
      403,
      "You do not have permission to publish this project.",
      "Forbidden"
    );
  }

  // check if the project exists
  const [row] = await getTable("sites").where({
    id: projectId,
  });

  if (!row) {
    throw customError(
      404,
      "Could not load the requested project.",
      "ProjectNotFound"
    );
  }

  if (!validTypes.includes(req.body.type)) {
    throw customError(400, `Type '${req.body.type}' not implemented!`);
  }

  if (!user.hasPermission(`struxt.publish.${req.body.type}`)) {
    throw customError(
      403,
      `You do not have permission to publish to ${req.body.type}!`
    );
  }

  if (req.body.projectId !== projectId) {
    throw customError(400, "Project id mismatch!");
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

    const destFile = join(siteDir, "assets", projectId, basename);

    await mkDirRecursive(dirname(destFile));
    await copyFile(srcFile, destFile);
  }

  // save the project files
  for (const file of body.files) {
    const filePath = join(siteDir, file.filename);
    await mkDirRecursive(dirname(filePath));

    let content = file.content;
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

  // get the form validation data
  const validation = await getFormValidationFromProject(
    projectId,
    body.type,
    project
  );

  const formNames = [...new Set(validation.map((v) => v.formName))];

  for (const formName of formNames) {
    const formSettings = await getFormSettings(projectId, body.type, formName);

    if (!formSettings) {
      const formSettings = await defaultFormSettings(
        parseInt(projectId),
        body.type,
        formName
      );
      await saveNewFormSettings(formSettings);
    }
  }

  // save the form validation data
  await saveValidationData(validation);

  // Create a new project
  res.json({
    success: true,
  });
});
