import {
  ProjectRole,
  ProjectRoleDocument,
} from "common/models/projects/ProjectRoles";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Get the project roles for the given user
 *
 * @param userId
 */
export async function getProjectRoles(userId: string): Promise<ProjectRole[]> {
  const collection = await getCollection("project_members");

  // load the roles for the user
  const cursor = collection.find<ProjectRoleDocument>({
    userId,
  });
  const projects = await toArray(cursor);

  // create a list of roles
  const list: ProjectRole[] = [];

  for (const project of projects) {
    for (const role of project.roles) {
      list.push({
        projectId: project.projectId,
        action: role,
      });
    }
  }

  return list;
}
