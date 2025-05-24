import { registerApi } from "server/api/registerApi";
import { ProjectInvitesApi } from "common/api/projects/projectInvites";
import { getProjectInvite } from "./projectInvite";
import { customError } from "common/custom-error/custom-error";

registerApi<ProjectInvitesApi>("/api/projects/invites/:inviteId")
  .post([], async ({ user, params }) => {
    const inviteId = params.inviteId;

    const invite = await getProjectInvite(inviteId);
    if (!invite) {
      throw customError(404, "Failed to accept invite. Invite not found.");
    }

    // check that the invite is for the current user
    if (invite.email !== user.email) {
      throw customError(403, "Could not accept this invite.");
    }

    return {
      success: false,
    };
  })
  .delete([], async ({ user, params }) => {
    const inviteId = params.inviteId;

    return {
      success: false,
    };
  });
