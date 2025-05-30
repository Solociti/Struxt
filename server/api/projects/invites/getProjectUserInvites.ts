import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import { getCollection, toArray } from "server/database/mongodb";
import { updateProjectInviteDetails } from "./projectInvite";

/**
 * Get the list of invites for the given user.
 *
 * @param userId
 * @returns
 */
export async function getProjectUserInvites(
  userId: string
): Promise<ProjectRolesInviteModel[]> {
  const collection = await getCollection<ProjectRolesInviteModel>(
    "project_members_invites"
  );

  const cursor = collection.find({
    "created.userId": userId,
    "accepted.active": { $ne: true },
    "cancelled.active": { $ne: true },
    expirationDate: { $gt: Math.floor(Date.now() / 1000) },
  });
  const list = await toArray(cursor);

  return await Promise.all(
    list.map(async (doc) => {
      const invite = new ProjectRolesInviteModel(doc);

      await updateProjectInviteDetails(invite);

      return invite;
    })
  );
}

/**
 * Get the list of invites for a project.
 *
 * @param projectId
 */
export async function getProjectInvitesList(
  projectId: string
): Promise<ProjectRolesInviteModel[]> {
  const collection = await getCollection<ProjectRolesInviteModel>(
    "project_members_invites"
  );

  if (!projectId) {
    throw new Error("Project ID is required to get invites.");
  }

  // get the list of invites for the project
  const cursor = collection.find({
    projectId,
    "accepted.active": { $ne: true },
    "cancelled.active": { $ne: true },
    expirationDate: { $gt: Math.floor(Date.now() / 1000) },
  });

  const list = await toArray(cursor);

  return await Promise.all(
    list.map(async (doc) => {
      const invite = new ProjectRolesInviteModel(doc);

      await updateProjectInviteDetails(invite);

      return invite;
    })
  );
}
