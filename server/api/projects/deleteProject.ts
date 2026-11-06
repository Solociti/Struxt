import { customError } from "common/custom-error/custom-error";
import { unpublishProject } from "../publish/unpublishProject";
import { getProjectData } from "./getProject";
import { saveProject } from "./saveProject";

const deleteInSeconds = 60 * 60 * 24 * 14; // 2 weeks

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
