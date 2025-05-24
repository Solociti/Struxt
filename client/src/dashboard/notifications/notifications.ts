import { getApi } from "client/api/api";
import { NotificationsApi } from "common/api/notifications/notifications";
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
