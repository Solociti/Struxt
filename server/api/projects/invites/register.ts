import { ProjectInvitesApi } from "common/api/projects/projectInvites";
import { customError } from "common/custom-error/custom-error";
import { registerApi } from "server/api/registerApi";
import { acceptUserInvite } from "./acceptUserInvite";
import { cancelUserInvite } from "./cancelUserInvite";
import { getProjectInvite } from "./projectInvite";

registerApi<ProjectInvitesApi>("/api/projects/invites/:inviteId")
  .post([], async ({ user, params }) => {
    const inviteId = params.inviteId;

    const invite = await getProjectInvite(inviteId);
    if (!invite) {
      throw customError(404, "Failed to accept invite. Invite not found.");
    }

    // check that the invite is for the current user
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw customError(403, "Could not accept this invite.");
    }

    // accept the invite
    const success = await acceptUserInvite(invite, user);

    return {
      success,
    };
  })
  .delete([], async ({ user, params }) => {
    const inviteId = params.inviteId;

    const invite = await getProjectInvite(inviteId);
    if (!invite) {
      throw customError(404, "Failed to decline invite. Invite not found.");
    }

    // check that the invite is for the current user
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw customError(403, "Could not decline this invite.");
    }

    // decline the invite
    const success = await cancelUserInvite(invite, {
      userId: user.id,
      displayName: user.name,
    });

    return {
      success,
    };
  });
