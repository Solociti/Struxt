import {
  createProjectRoleDoc,
  ProjectRoleDocument,
  ProjectRoleVisualDocument,
} from "common/models/projects/ProjectRoles";
import { getUser } from "server/auth/user/getUser";
import { getCollection, toArray } from "server/database/mongodb";

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

      // get the user display name
      const user = await getUser(doc.userId);

      doc.userDisplayName = user?.name || "";
      doc.userEmail = user?.email || "";

      return doc as ProjectRoleVisualDocument;
    })
  );

  return final;
}
