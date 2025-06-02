import { customError } from "common/custom-error/custom-error";
import {
  createProjectRoleDoc,
  ProjectRoleDocument,
  ProjectRoleVisualDocument,
} from "common/models/projects/ProjectRoles";
import {
  ProjectRoleList,
  ProjectRoleTypes,
  roles,
} from "common/models/user/Roles";
import { getUser } from "server/auth/user/getUser";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Add the user details to the project role
 *
 * @param doc
 * @returns
 */
async function addUserDetails(
  doc: Partial<ProjectRoleVisualDocument> & ProjectRoleDocument
) {
  // get the user display name
  const user = await getUser(doc.userId);

  doc.userDisplayName = user?.name || "";
  doc.userEmail = user?.email || "";

  return doc as ProjectRoleVisualDocument;
}

/**
 * Get the project roles for the given project
 *
 * @param projectId
 */
export async function getProjectRoleVisualDocs(projectId: string) {
  const collection = await getCollection<ProjectRoleDocument>(
    "project_members"
  );

  const cursor = await collection.find({
    projectId,
  });

  const list = await toArray(cursor);

  const final: ProjectRoleVisualDocument[] = await Promise.all(
    list.map(async (data) => {
      const doc: Partial<ProjectRoleVisualDocument> & ProjectRoleDocument =
        createProjectRoleDoc(data);

      return await addUserDetails(doc);
    })
  );

  return final;
}

/**
 * Get the project role visual document
 *
 * @param projectId
 * @param userId
 */
async function getProjectRoleVisualDoc(projectId: string, userId: string) {
  const collection = await getCollection<ProjectRoleDocument>(
    "project_members"
  );

  const doc = await collection.findOne({
    projectId,
    userId,
  });

  if (!doc) {
    throw customError(404, "Could not find the Project Role");
  }

  const document: Partial<ProjectRoleVisualDocument> & ProjectRoleDocument =
    createProjectRoleDoc(doc);

  return await addUserDetails(document);
}

/**
 * Update the project roles for the user
 *
 * @param projectId
 * @param userId
 * @param roles
 */
export async function updateProjectRoles(
  projectId: string,
  userId: string,
  roles: ProjectRoleTypes[]
) {
  // filter out any unknown roles and de-duplicate
  const roleList = [
    ...new Set(roles.filter((role) => ProjectRoleList.includes(role))),
  ];

  const collection = await getCollection<ProjectRoleDocument>(
    "project_members"
  );

  // update the document
  const result = await collection.updateOne(
    {
      projectId,
      userId,
    },
    {
      $set: {
        roles: roleList,
      },
    }
  );

  if (result.modifiedCount !== 1) {
    throw customError(403, "Failed to update the user roles.");
  }

  return await getProjectRoleVisualDoc(projectId, userId);
}

/**
 * Removes a user from a project
 *
 * @param projectId
 * @param userId
 * @returns
 */
export async function removeProjectUser(projectId: string, userId: string) {
  // get the list of roles in the project
  const list = await getProjectRoleVisualDocs(projectId);

  const existing = list.find((item) => item.userId === userId);
  if (!existing) {
    throw customError(404, "User not found in project.");
  }

  // ensure that there is another admin in the project
  const adminCount = list.filter(
    (item) =>
      item.userId !== userId && item.roles.includes(roles.projects.admin)
  ).length;
  if (adminCount === 0) {
    throw customError(
      400,
      "You cannot remove the last admin from the project. Please assign another user as admin before removing this user."
    );
  }

  // remove the user from the project
  const collection = await getCollection<ProjectRoleDocument>(
    "project_members"
  );
  await collection.deleteOne({
    projectId,
    userId,
  });

  return { success: true };
}
