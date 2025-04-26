import { PublishApi } from "common/api/publish/publish";
import { customError } from "common/custom-error/custom-error";
import { FormSettingsField } from "common/models/projects/forms/FormSettingsModel";
import { PublishModel } from "common/models/projects/PublishModel";
import { roles } from "common/models/user/Roles";
import { existsSync } from "node:fs";
import { copyFile, writeFile } from "node:fs/promises";
import path, { dirname, join } from "node:path";
import { createSimpleId } from "server/utils/createId";
import { getFormFieldsFromEditorData } from "../../forms/getFormFieldsFromEditorData";
import { getFormSettings } from "../../forms/settings/getFormSettings";
import {
  defaultFormSettings,
  saveFormSettings,
} from "../../forms/settings/saveFormSettings";
import { cleanDir } from "../../utils/cleanDir";
import { copyDir } from "../../utils/copyDir";
import { mkDirRecursive } from "../../utils/mkDir";
import { getAssetDir, getSiteDir } from "../../utils/uploadDir";
import { getProjectEditorData } from "../projects/getProject";
import { registerApi } from "../registerApi";
import { savePublish } from "./savePublish";

const validTypes = ["staging", "production"];

registerApi<PublishApi>("/api/publish/:projectId").post(
  [roles.struxt.publish.staging, roles.struxt.publish.production],
  async ({ params, user, body }) => {
    const publishType = body.type;
    const projectId = params.projectId;

    // check if the publish type is valid
    if (!validTypes.includes(publishType)) {
      throw customError(400, `Type '${publishType}' not implemented!`);
    }

    // perform some sanity checks
    if (body.projectId !== projectId) {
      throw customError(400, "Project id mismatch!");
    }

    // check if the user has access to publish the desired outcome
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

    // load the editor data and check if the project exists
    // the get project editor data already throws an error if not found
    const { editorData } = await getProjectEditorData(projectId);

    // generate a publish id
    const publishId = await createSimpleId("publish");

    // setup the site directory
    // TODO: create a zero downtime deployment
    const siteDir = getSiteDir(body.type, projectId);
    await cleanDir(siteDir);
    await mkDirRecursive(siteDir);

    // copy the asset files to the project directory
    const assetFiles = editorData.assets as {
      src: string;
      type: "image";
    }[];

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
    const formFields = getFormFieldsFromEditorData(editorData);

    const formNames = [...new Set(formFields.map((v) => v.formName))];

    for (const formName of formNames) {
      let formSettings = await getFormSettings(projectId, body.type, formName);

      if (!formSettings) {
        formSettings = defaultFormSettings(projectId, body.type, formName);
      }

      // update the form settings
      formSettings.updateFields(
        formFields
          .filter((v) => v.formName === formName)
          .map((v) => ({
            name: v.fieldName,
            type: v.fieldType as FormSettingsField["type"],
            required: v.fieldRequired,
          }))
      );

      await saveFormSettings(formSettings);
    }

    // save the publish details to database
    const model = new PublishModel({
      uuid: publishId,
      projectId: projectId,
      created: {
        date: Math.floor(Date.now() / 1000),
        userId: user.id,
        displayName: user.name,
      },
      siteEnv: publishType,
      screenshotUrl: "", // TODO: setup a job to capture a screenshot
    });
    await savePublish(model);

    return {
      success: true,
    };
  }
);
