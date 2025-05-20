import { getApi, postApi } from "client/api/api";
import { ProjectRolesApi } from "common/api/projects/projectRoles";
import { ProjectRoleTypes } from "common/models/user/Roles";

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

/**
 * Update the roles for a project
 *
 * @param projectId
 * @param roles
 * @returns
 */
export async function updateProjectRoles(
  projectId: string,
  userId: string,
  roles: ProjectRoleTypes[]
) {
  const body: ProjectRolesApi["PostBody"] = {
    userId,
    roles,
  };

  const response: ProjectRolesApi["PostResponse"] = await postApi(
    ["/api/projects", projectId, "roles"],
    body
  );

  return response.item;
}
