import { customError } from "common/custom-error/custom-error";
import { getProjectData } from "./getProject";
import { saveProject } from "./saveProject";
import { unpublishProject } from "./unpublishProject";

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
) {}

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
}
