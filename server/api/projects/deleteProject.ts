import { customError } from "common/custom-error/custom-error";
import { dirname } from "node:path";
import { purgeProjectChats } from "server/aiPilot/chat/deleteChat";
import { rmDirRecursive } from "server/hfs/dirOps";
import {
  getBasePublishDir,
  getProjectFilesDir,
  getProjectPublishDir,
  getProjectsParentDir,
  getScreenshotDir,
} from "server/utils/uploadDir";
import { unpublishProject } from "../publish/unpublishProject";
import { deleteProjectRecords } from "./delete/records";
import { getProjectData } from "./getProject";
import { cancelUserInvite } from "./invites/cancelUserInvite";
import { getProjectInvitesList } from "./invites/getProjectUserInvites";
import { saveProject } from "./saveProject";

const daySeconds = 60 * 60 * 24;
const deleteInSeconds = 14 * daySeconds;

/**
 * Schedule a project to be permanently deleted
 *
 * @param projectId
 * @param user
 */
export async function scheduleProjectDelete(
  projectId: string,
  user: { userId: string; displayName: string },
) {
  const project = await getProjectData(projectId);

  if (project.deleted.active) {
    throw customError(400, "Project already scheduled for deletion.");
  }

  const date = Math.floor(Date.now() / 1000);
  project.deleted = {
    ...project.deleted,
    ...user,
    active: true,
    date: date,
    purgeDate: date + deleteInSeconds,
  };

  project.updated = {
    ...project.updated,
    date: date,
    ...user,
  };

  await saveProject(project);

  // remove the public site
  await unpublishProject(projectId, user);

  // cancel all pending invites
  const invites = await getProjectInvitesList(projectId);
  for (const invite of invites) {
    // cancel invite
    await cancelUserInvite(invite, user);
  }

  return {
    success: true,
    purgeDate: project.deleted.purgeDate,
  };
}

/**
 * Schedule a project to be permanently deleted
 *
 * @param projectId
 * @param user
 */
export async function restoreProject(
  projectId: string,
  user: { userId: string; displayName: string },
) {
  const project = await getProjectData(projectId);

  if (!project.deleted.active) {
    throw customError(
      400,
      "Cannot restore a project that is not scheduled for deletion.",
    );
  }

  project.deleted = {
    ...project.deleted,
    userId: "",
    displayName: "",
    active: false,
    date: 0,
    purgeDate: 0,
  };

  project.updated = {
    ...project.updated,
    date: Math.floor(Date.now() / 1000),
    ...user,
  };

  await saveProject(project);

  return {
    success: true,
  };
}

/**
 * Permanently delete a project and all its data
 *
 * @param projectId
 */
export async function permanentDeleteProject(
  projectId: string,
  log: (msg: string) => void,
) {
  const project = await getProjectData(projectId);
  if (!project.deleted.active) {
    throw new Error("Project not marked for deletion.");
  }

  // delete the project dir (uploads, form data, screenshots, etc)
  const projectDir = dirname(getProjectFilesDir(projectId));
  const screenshotDir = getScreenshotDir(projectId);

  await rmDirRecursive(projectDir, getProjectsParentDir());
  log(`Dir: ${projectDir}`);
  await rmDirRecursive(screenshotDir, getScreenshotDir());
  log(`Dir: ${screenshotDir}`);

  // delete all published site data (delete the project folder in the public dir)
  const publicDir = getProjectPublishDir(projectId);
  await rmDirRecursive(publicDir, getBasePublishDir());
  log(`Dir: ${publicDir}`);

  // delete langchain conversations and data
  await purgeProjectChats(projectId, log);

  // delete DB records
  await deleteProjectRecords(projectId, log);
}
