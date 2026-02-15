import { PublishApi } from "common/api/publish/publish";
import { customError } from "common/custom-error/custom-error";
import {
  EnvironmentTypes,
  getPrimaryDomain,
  getValidDomains,
} from "common/models/projects/Environment";
import { FormSettingsField } from "common/models/projects/forms/FormSettingsModel";
import { PublishModel } from "common/models/projects/PublishModel";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getFormFieldsFromEditorData } from "server/forms/getFormFieldsFromEditorData";
import { getFormSettings } from "server/forms/settings/getFormSettings";
import {
  defaultFormSettings,
  saveFormSettings,
} from "server/forms/settings/saveFormSettings";
import { copyDir } from "server/utils/copyDir";
import { createSimpleId } from "server/utils/createId";
import { mkDirRecursive } from "server/utils/mkDir";
import { getProjectPublicDir, getPublishDir } from "server/utils/uploadDir";
import { getProjectData } from "../projects/getProject";
import { schedulePublishScreenshot } from "../projects/projectScreenshots";
import { saveProject } from "../projects/saveProject";
import { createEditorSnapshot } from "../projects/snapshots/saveEditorSnapshot";
import { scheduleCleanPublish } from "./queue";
import { savePublish, setActivePublish } from "./savePublish";
import { updateProjectProxy } from "./updateProxy";

/**
 * Publish the given project to the given environment.
 *
 * @param projectId
 * @param projectEnv
 */
export async function publishProject(
  projectId: string,
  projectEnv: EnvironmentTypes,
  files: PublishApi["PostBody"]["files"],
  user: { userId: string; displayName: string },
): Promise<Omit<PublishApi["PostResponse"], "success">> {
  // load the editor data and check if the project exists
  // the get project editor data already throws an error if not found
  const project = await getProjectData(projectId);

  // remove any deleted domains from the project environment
  project[projectEnv].domains = project[projectEnv].domains.filter(
    (d) => !d.deleted.active,
  );

  // check if the project has domains to publish to
  const { domains } = getValidDomains(project[projectEnv]);
  const primaryDomain = getPrimaryDomain(domains);

  if (domains.length === 0 || !primaryDomain) {
    throw customError(400, "No domains set for the project");
  }

  // generate a publish id
  const publishId = await createSimpleId("publish");

  const publishModel = new PublishModel({
    uuid: publishId,
    projectId: projectId,
    created: {
      ...user,
      date: Math.floor(Date.now() / 1000),
    },
    siteEnv: projectEnv,
    screenshotUrl: "",
  });

  // setup the site directory
  const siteDir = getPublishDir(projectId, projectEnv, publishId);

  // if the directory exists, throw an error
  if (existsSync(siteDir)) {
    throw customError(500, "The publish directory already exists!");
  }

  await mkDirRecursive(siteDir);

  // copy the project's `public/` directory into the publish output so
  // default/static assets are present. Editor files are written afterwards
  // and will overwrite any defaults.
  const projectPublicDir = getProjectPublicDir(projectId);

  if (existsSync(projectPublicDir)) {
    try {
      await copyDir(projectPublicDir, siteDir, {
        replace: false,
        preserveTimestamps: true,
      });
    } catch (err) {
      throw customError(500, "Failed to copy public directory.");
    }
  }

  // save the project files
  for (const file of files) {
    const filePath = join(siteDir, file.filename);
    await mkDirRecursive(dirname(filePath));

    let content = file.content;
    await writeFile(filePath, content, {
      encoding: "utf-8",
    });
  }

  // get the form validation data
  const formFields = getFormFieldsFromEditorData(project.editorData);

  const formNames = [...new Set(formFields.map((v) => v.formName))];

  for (const formName of formNames) {
    let formSettings = await getFormSettings(projectId, projectEnv, formName);

    if (!formSettings) {
      formSettings = defaultFormSettings(projectId, projectEnv, formName);
    }

    // update the form settings
    formSettings.updateFields(
      formFields
        .filter((v) => v.formName === formName)
        .map((v) => ({
          name: v.fieldName,
          type: v.fieldType as FormSettingsField["type"],
          required: v.fieldRequired,
        })),
    );

    await saveFormSettings(formSettings);
  }

  // save the publish details to database
  await savePublish(publishModel);

  // update the npm proxy host settings
  await updateProjectProxy(project, publishModel);

  await saveProject(project);

  // set the active publish
  await setActivePublish(publishId);

  await createEditorSnapshot(projectId, projectEnv, project.editorData, user);

  await schedulePublishScreenshot(publishId, projectEnv, projectId);
  await scheduleCleanPublish(projectId);

  return {
    publishId,
    domains: domains.map((d) => d.domain),
    primaryDomain: primaryDomain.domain,
  };
}
