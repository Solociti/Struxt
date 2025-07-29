import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import { publishMessage } from "server/database/dragonFly";
import { getCollection } from "server/database/mongodb";

/**
 * Cancel/Delete a user invite
 *
 * @param invite
 * @param user the user that is cancelling the invite
 * @returns
 */
export async function cancelUserInvite(
  invite: ProjectRolesInviteModel,
  user: { userId: string; displayName: string }
): Promise<boolean> {
  const collection = await getCollection<ProjectRolesInviteModel>(
    "project_members_invites"
  );

  if (!invite || invite.cancelled.active || invite.accepted.active) {
    return false;
  }

  invite.cancelled = {
    ...invite.cancelled,
    active: true,
    date: Math.floor(Date.now() / 1000),
    userId: user.userId,
    displayName: user.displayName,
  };

  // update the invite to cancel it
  const result = await collection.updateOne(
    {
      inviteId: invite.inviteId,
    },
    {
      $set: {
        cancelled: invite.cancelled,
      },
    }
  );
  if (result.modifiedCount === 0) {
    return false;
  }

  publishMessage("notifications", invite.email.toLowerCase()).catch((err) =>
    console.error("Notification publish failed:", err)
  );

  return true;
}
