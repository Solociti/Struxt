import { ProjectModel } from "common/models/projects/ProjectModel";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import { updateModelActionUser } from "server/auth/user/getUser";
import { getCollection } from "server/database/mongodb";

/**
 * Load the project invite from database
 *
 * @param inviteId
 * @returns
 */
export async function getProjectInvite(
  inviteId: string
): Promise<ProjectRolesInviteModel | null> {
  const collection = await getCollection<ProjectRolesInviteModel>(
    "project_members_invites"
  );

  const invite = await collection.findOne({
    inviteId,
  });

  if (!invite) {
    return null;
  }

  return new ProjectRolesInviteModel(invite);
}

/**
 * Update the project name and user display name in the invite
 *
 * @param invite
 */
export async function updateProjectInviteDetails(
  invite: ProjectRolesInviteModel
): Promise<ProjectRolesInviteModel> {
  const projectCollection = await getCollection<ProjectModel>("projects");
  const projectDoc = await projectCollection.findOne(
    {
      projectId: invite.projectId,
    },
    {
      projection: {
        name: 1,
      },
    }
  );

  if (projectDoc) {
    invite.projectName = projectDoc.name;
  }

  await updateModelActionUser(invite.created);
  await updateModelActionUser(invite.accepted);
  await updateModelActionUser(invite.cancelled);

  return invite;
}
