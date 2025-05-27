import { customError } from "common/custom-error/custom-error";
import {
  createProjectRoleDoc,
  ProjectRoleDocument,
} from "common/models/projects/ProjectRoles";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import { UserModel } from "common/models/user/UserModel";
import { getCollection } from "server/database/mongodb";

/**
 * Accepts the user invite to a project.
 *
 * @param invite
 */
export async function acceptUserInvite(
  invite: ProjectRolesInviteModel,
  user: UserModel
): Promise<boolean> {
  // check if the invite is valid
  const { valid, message } = invite.isInviteValid();
  if (!valid) {
    throw customError(400, message);
  }

  const collection = await getCollection<ProjectRoleDocument>(
    "project_members"
  );
  const inviteCollection = await getCollection<ProjectRolesInviteModel>(
    "project_members_invites"
  );

  // check if the user is already a member of the project
  const roleDoc = await collection.findOne({
    userId: user.id,
    projectId: invite.projectId,
  });
  if (roleDoc) {
    throw customError(400, "You are already a member of this project.");
  }

  // create a project role for the user
  const role = createProjectRoleDoc({
    userId: user.id,
    projectId: invite.projectId,
    roles: invite.roles,
    updated: {
      ...invite.created,
      date: Math.floor(Date.now() / 1000),
    },
  });

  await collection.insertOne(role);

  // update the invite to mark it as accepted
  invite.accepted = {
    ...invite.accepted,
    active: true,
    date: Math.floor(Date.now() / 1000),
    userId: user.id,
    displayName: user.name,
  };

  await inviteCollection.updateOne(
    {
      inviteId: invite.inviteId,
    },
    {
      $set: {
        accepted: invite.accepted,
      },
    }
  );

  return true;
}
