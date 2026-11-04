import {
  ProjectCreateApi,
  ProjectDeleteApi,
  ProjectDetailsApi,
  ProjectEditorApi,
  ProjectListApi,
} from "common/api/projects/project";
import { deleteApi, getApi, postApi } from "../api/api";

/**
 * Create a new project on the server
 *
 * @param name
 * @returns
 */
export async function createNewProject(name: string) {
  const body: ProjectCreateApi["PostBody"] = {
    name,
  };

  // create a new project on the server
  const response = await postApi<ProjectCreateApi>("/api/projects/new", body);

  return response;
}

/**
 * Get the project data from server
 *
 * @param projectId
 * @returns
 */
export async function getProject(projectId: string) {
  // load the project data from the server
  const response = await getApi<ProjectEditorApi>([
    "/api/projects",
    projectId,
    "editor",
  ]);

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
  const response = await getApi<ProjectListApi>(`/api/projects`);
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
  const response = await getApi<ProjectDetailsApi>([
    "/api/projects",
    projectId,
    "details",
  ]);
  return response.details;
}

/**
 * Update a project details property on the server
 *
 * @param projectId
 * @param propPath
 * @param value
 * @returns
 */
export async function updateProjectDetails(
  projectId: string,
  propPath: ProjectDetailsApi["PostBody"]["propPath"],
  value: string | number | boolean | null,
) {
  const body: ProjectDetailsApi["PostBody"] = {
    propPath,
    value,
  };

  const response = await postApi<ProjectDetailsApi>(
    ["/api/projects", projectId, "details"],
    body,
  );

  return response;
}

/**
 * Schedule a permanent delete of the project
 *
 * @param projectId
 * @returns
 */
export async function deleteProject(projectId: string) {
  return await deleteApi<ProjectDeleteApi>(
    ["/api/projects", projectId, "delete"],
    {},
  );
}

/**
 * Restore a recently deleted project
 *
 * @param projectId
 * @returns
 */
export async function restoreProject(projectId: string) {
  return await postApi<ProjectDeleteApi>(
    ["/api/projects", projectId, "restore"],
    {},
  );
}
