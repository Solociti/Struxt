import { NotificationsApi } from "common/api/notifications/notifications";
import { getProjectUserInvites } from "server/api/projects/invites/getProjectUserInvites";
import { registerApi } from "../registerApi";

registerApi<NotificationsApi>("/api/notifications").get(
  [],
  async ({ user }) => {
    // TODO: get the list of notifications for the user

    // get the list of project invites for the user
    const invites = await getProjectUserInvites(user.id);

    return {
      list: [],
      invites,
    };
  }
);
