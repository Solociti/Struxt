import { deleteApi, getApi, postApi } from "client/api/api";
import { NotificationsApi } from "common/api/notifications/notifications";
import { ProjectInvitesApi } from "common/api/projects/projectInvites";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";

/**
 * Get the list of notifications for the current user
 *
 * @returns
 */
export async function getNotifications() {
  const params: NotificationsApi["GetQuery"] = {};
  const response: NotificationsApi["GetResponse"] = await getApi(
    "/api/notifications",
    params
  );

  response.invites = response.invites.map(
    (invite) => new ProjectRolesInviteModel(invite)
  );

  return response;
}

/**
 * Accept a project invite
 *
 * @param inviteId
 * @returns
 */
export async function acceptProjectInvite(inviteId: string) {
  const body: ProjectInvitesApi["PostBody"] = {};

  const response: ProjectInvitesApi["PostResponse"] = await postApi(
    ["/api/projects/invites/", inviteId],
    body
  );

  return response;
}

/**
 * Decline a project invite
 *
 * @param inviteId
 * @returns
 */
export async function declineProjectInvite(inviteId: string) {
  const response: ProjectInvitesApi["DeleteResponse"] = await deleteApi([
    "/api/projects/invites",
    inviteId,
  ]);

  return response;
}
