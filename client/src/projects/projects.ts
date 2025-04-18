import {
  ProjectDetailsApi,
  ProjectEditorApi,
  ProjectListApi,
} from "common/api/projects/project";
import { getApi, postApi } from "../api/api";

/**
 * Get the project data from server
 *
 * @param projectId
 * @returns
 */
export async function getProject(projectId: string) {
  // load the project data from the server
  const response: ProjectEditorApi["GetResponse"] = await getApi(
    `/api/projects/${projectId}/editor`
  );

  return response;
}

/**
 * Save the project data to the server
 *
 * @param projectId
 * @param editorData
 * @returns
 */
export async function saveProject(projectId: string, editorData: any) {
  const body: ProjectEditorApi["PostBody"] = {
    projectId,
    editorData,
  };

  // save the project data to the server
  return await postApi(`/api/projects/${projectId}/editor`, body);
}

/**
 * Load the list of available projects from the server
 *
 * @returns
 */
export async function getAvailableProjects() {
  const response: ProjectListApi["GetResponse"] = await getApi(`/api/projects`);
  return response;
}

/**
 * Load the project details from the server
 *
 * @param projectId
 * @returns
 */
export async function getProjectDetails(projectId: string) {
  // load the project details from the server
  const response: ProjectDetailsApi["GetResponse"] = await getApi([
    "/api/projects",
    projectId,
    "details",
  ]);
  return response.details;
}
