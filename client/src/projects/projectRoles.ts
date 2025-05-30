import { deleteApi, getApi, postApi } from "client/api/api";
import {
  ProjectRolesApi,
  ProjectRolesInviteApi,
} from "common/api/projects/projectRoles";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
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

/**
 * Invite a user to a project
 *
 * @param projectId
 * @param email
 * @param roles
 * @param message
 * @returns
 */
export async function inviteUser(
  projectId: string,
  email: string,
  roles: ProjectRoleTypes[],
  message: string
) {
  const body: ProjectRolesInviteApi["PostBody"] = {
    email,
    roles,
    message,
  };

  const response: ProjectRolesInviteApi["PostResponse"] = await postApi(
    ["/api/projects", projectId, "roles/invite"],
    body
  );

  return response.invite;
}

/**
 * Get the list of current user invites for a project
 *
 * @param projectId
 * @returns
 */
export async function getProjectInvitesList(projectId: string) {
  const response: ProjectRolesInviteApi["GetResponse"] = await getApi([
    "/api/projects",
    projectId,
    "roles/invite",
  ]);

  return response.list.map((invite) => new ProjectRolesInviteModel(invite));
}

/**
 * Get the list of current user invites for a project
 *
 * @param projectId
 * @returns
 */
export async function cancelUserInvite(projectId: string, inviteId: string) {
  const response: ProjectRolesInviteApi["DeleteResponse"] = await deleteApi(
    ["/api/projects", projectId, "roles/invite"],
    {
      params: {
        inviteId,
      },
    }
  );

  return response;
}
