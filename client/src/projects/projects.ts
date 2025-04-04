import { ProjectListApi } from "../../../common/models/projects/api";
import { getApi, postApi } from "../api/api";

/**
 * Get the project data from server
 *
 * @param projectId
 * @returns
 */
export async function getProject(projectId: string) {
  // load the project data from the server
  const response = await getApi(`/api/projects/${projectId}`);
  return response;
}

/**
 * Save the project data to the server
 *
 * @param projectId
 * @param project
 * @returns
 */
export async function saveProject(projectId: string, project: any) {
  // save the project data to the server
  return await postApi(`/api/projects/${projectId}`, {
    id: projectId,
    project,
  });
}

/**
 * Load the list of available projects from the server
 *
 * @returns
 */
export async function getAvailableProjects() {
  const response: ProjectListApi = await getApi(`/api/projects`);
  return response;
}
