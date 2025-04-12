import { customError } from "common/custom-error/custom-error";
import { db_site_publish_info } from "common/models/database";
import { roles } from "common/models/user/Roles";
import express from "express";
import { existsSync } from "node:fs";
import { copyFile, writeFile } from "node:fs/promises";
import path, { dirname, join } from "node:path";
import { protectEndpoint } from "../../auth/protectEndpoint";
import { getFormValidationFromProject } from "../../forms/getFormValidationFromProject";
import { saveValidationData } from "../../forms/saveValidationData";
import {
  defaultFormSettings,
  saveNewFormSettings,
} from "../../forms/sendEmail/saveFormSettings";
import { getFormSettings } from "../../forms/settings/getFormSettings";
import { cleanDir } from "../../utils/cleanDir";
import { copyDir } from "../../utils/copyDir";
import { getTable, knex } from "../../utils/database";
import { mkDirRecursive } from "../../utils/mkDir";
import { getAssetDir, getSiteDir } from "../../utils/uploadDir";
import { userFromReq } from "../auth/userFromReq";

export const router = express.Router();

const validTypes = ["staging", "production"];

router.use(
  protectEndpoint([
    roles.struxt.publish.staging,
    roles.struxt.publish.production,
  ])
);

router.post("/:projectId", async (req, res) => {
  if (!validTypes.includes(req.body.type)) {
    throw customError(400, `Type '${req.body.type}' not implemented!`);
  }

  const publishType = req.body.type;
  const projectId = req.params.projectId;

  if (req.body.projectId !== projectId) {
    throw customError(400, "Project id mismatch!");
  }

  const user = await userFromReq(req);

  if (!user.hasPermission(roles.struxt.admin)) {
    if (
      publishType === "production" &&
      !user.hasPermission(roles.struxt.publish.production)
    ) {
      throw customError(
        403,
        "You do not have permission to publish to production!"
      );
    }

    if (
      publishType === "production" &&
      !user.hasProjectPermission(projectId, roles.projects.publish.production)
    ) {
      throw customError(
        403,
        "You do not have permission to publish this site to production!"
      );
    }

    if (
      publishType === "staging" &&
      !user.hasPermission(roles.struxt.publish.staging)
    ) {
      throw customError(
        403,
        "You do not have permission to publish to staging!"
      );
    }

    if (
      publishType === "staging" &&
      !user.hasProjectPermission(projectId, roles.projects.publish.staging)
    ) {
      throw customError(
        403,
        "You do not have permission to publish this site to staging!"
      );
    }
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

  const project = JSON.parse(row.project);

  const body: {
    projectId: string;
    type: "staging" | "production";
    files: { filename: string; content: string; mimeType: string }[];
  } = req.body;

  // TODO: create a zero downtime deployment
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

  // save the publish details to database
  const publishInfo: Omit<db_site_publish_info, "id"> = {
    site_id: parseInt(projectId),
    site_env: publishType,
    published_at: new Date(),
    published_by: user.id,
    screenshot_url: "",
  };
  await knex.table("site_publish_info").insert(publishInfo);

  // Create a new project
  res.json({
    success: true,
  });
});
