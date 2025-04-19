import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { getFormSubmissionList } from "server/forms/getFormSubmission";
import { calcDirSize } from "../../utils/calcDirSize";
import { getAssetDir } from "../../utils/uploadDir";
import { getLatestPublish } from "../publish/getPublish";
import { getProjectData } from "./getProject";

/**
 * Load the project details from the database
 *
 * @param projectId
 */
export async function getProjectDetails(projectId: string) {
  const project = await getProjectData(projectId);

  const details: ProjectDetails = {
    projectId: project.projectId,
    name: project.name,
    description: project.description,

    staging: project.staging,
    production: project.production,

    publish: {
      staging: {
        active: false,
        date: 0,
        userId: "",
        displayName: "",
        screenshotUrl: "",
      },
      production: {
        active: false,
        date: 0,
        userId: "",
        displayName: "",
        screenshotUrl: "",
      },
    },

    storage: {
      ...project.storage,
      usedBytes: 0,
    },

    forms: [],
  };

  // get the latest publish data for both staging and production
  const stagingPublish = await getLatestPublish(projectId, "staging");
  const productionPublish = await getLatestPublish(projectId, "production");

  details.publish.staging = {
    ...details.publish.staging,
    active: !!stagingPublish,
    date: stagingPublish?.created.date || 0,
    userId: stagingPublish?.created.userId || "",
    displayName: stagingPublish?.created.displayName || "",
    screenshotUrl: stagingPublish?.screenshotUrl || "",
  };

  details.publish.production = {
    ...details.publish.production,
    active: !!productionPublish,
    date: productionPublish?.created.date || 0,
    userId: productionPublish?.created.userId || "",
    displayName: productionPublish?.created.displayName || "",
    screenshotUrl: productionPublish?.screenshotUrl || "",
  };

  // count the form submissions
  const submissions = await getFormSubmissionList(projectId, "production");
  details.forms = submissions;

  // calculate the storage used
  const dir = getAssetDir(projectId);
  const storageUsed = await calcDirSize(dir);
  details.storage.usedBytes = storageUsed;

  return details;
}
