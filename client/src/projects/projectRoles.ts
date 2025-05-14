import { getApi } from "client/api/api";
import { ProjectRolesApi } from "common/api/projects/projectRoles";

/**
 * Get the list of project roles for the project
 *
 * @param projectId
 * @returns
 */
export async function getProjectRoleDocs(projectId: string) {
  const response: ProjectRolesApi["GetResponse"] = await getApi([
    "/api/projects",
    projectId,
    "roles",
  ]);

  return response.list;
}
