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
  const response = await getApi<ProjectRolesApi>([
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

  const response = await postApi<ProjectRolesApi>(
    ["/api/projects", projectId, "roles"],
    body
  );

  return response.item;
}

/**
 * Removes a user from a project
 *
 * @param projectId
 * @param userId
 * @returns
 */
export async function removeProjectUser(projectId: string, userId: string) {
  const response = await deleteApi<ProjectRolesApi>(
    ["/api/projects", projectId, "roles"],
    {
      userId,
    }
  );

  return response;
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

  const response = await postApi<ProjectRolesInviteApi>(
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
  const response = await getApi<ProjectRolesInviteApi>([
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
  const response = await deleteApi<ProjectRolesInviteApi>(
    ["/api/projects", projectId, "roles/invite"],
    {
      inviteId,
    }
  );

  return response;
}
