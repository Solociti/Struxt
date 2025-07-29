import { NotificationsApi } from "common/api/notifications/notifications";
import { getProjectUserInvites } from "server/api/projects/invites/getProjectUserInvites";
import { registerObserver } from "server/ws/observers";
import { registerApi } from "../registerApi";
import { subscribeToChannel } from "server/database/dragonFly";

registerApi<NotificationsApi>("/api/notifications").get(
  [],
  async ({ user }) => {
    // TODO: get the list of notifications for the user

    // get the list of project invites for the user
    const invites = await getProjectUserInvites(user.email);

    return {
      list: [],
      invites,
    };
  }
);

registerObserver("notifications", async ({ user, send }) => {
  const getAndSend = async () => {
    // get the list of project invites for the user
    const invites = await getProjectUserInvites(user.email);

    send({
      list: [],
      invites,
    });
  };

  getAndSend();

  // setup dragonfly pub/sub
  const unsubscribe = subscribeToChannel(
    "notifications",
    false,
    (msg: string) => {
      if (msg === user.email.toLowerCase()) {
        getAndSend();
      }
    }
  );

  return {
    onUnregister() {
      // clean up dragonfly pub/sub
      unsubscribe();
    },
  };
});
