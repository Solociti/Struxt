import { customError } from "common/custom-error/custom-error";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import { ProjectRoleList, ProjectRoleTypes } from "common/models/user/Roles";
import { getCollection } from "server/database/mongodb";
import { createSimpleId } from "server/utils/createId";
import { scheduleInviteEmail } from "../queues/setupQueue";

/**
 * Creates a new invite for the given user email.
 *
 * The user doesn't need to be created to create an invite.
 *
 * @param projectId
 * @param email
 * @param roles
 * @param message
 * @param user
 * @returns
 */
export async function inviteUser(
  projectId: string,
  email: string,
  roles: ProjectRoleTypes[],
  message: string,
  user: { userId: string; displayName: string }
): Promise<ProjectRolesInviteModel> {
  const collection = await getCollection<ProjectRolesInviteModel>(
    "project_members_invites"
  );

  // validate the roles list
  roles = [...new Set(roles.filter((role) => ProjectRoleList.includes(role)))];
  if (roles.length === 0) {
    throw customError(403, "No valid roles provided");
  }

  const inviteId = await createSimpleId("invite");

  // create the new invite
  const invite = new ProjectRolesInviteModel({
    inviteId,
    projectId,
    email,
    roles,
    message,
    created: {
      userId: user.userId,
      displayName: user.displayName,
    },
  });

  await collection.insertOne(invite);

  // schedule the invite email to be sent
  await scheduleInviteEmail(inviteId);

  return invite;
}
