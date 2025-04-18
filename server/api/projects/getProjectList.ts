import { ModelAsDocument } from "common/models/Model";
import { ProjectListItem } from "common/models/projects/ProjectItem";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { ProjectRoleDocument } from "common/models/projects/ProjectRoles";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Get the list of project ids that a user has access to
 *
 * @param userId
 * @returns
 */
async function getUserProjectIds(userId: string) {
  // TODO: validate that this function actually returns the correct project ids
  const collection = await getCollection("project_members");

  const cursor = collection.find<ModelAsDocument<ProjectRoleDocument>>(
    { userId },
    {
      projection: { projectId: 1 },
    }
  );
  const list = await toArray(cursor);
  const projectIds = list.map((item) => item.projectId);

  const uniqueProjectIds = [...new Set(projectIds)];
  return uniqueProjectIds;
}

/**
 * Get the list of projects for a user
 *
 * @param userId
 * @returns
 */
export async function getProjectsForUser(userId: string) {
  // TODO: validate that this function actually returns the correct projects
  // get the list of project ids for the user
  const projectIds = await getUserProjectIds(userId);

  const collection = await getCollection("projects");
  const cursor = collection.find<ModelAsDocument<ProjectModel>>(
    { projectId: { $in: projectIds } },
    {
      projection: { projectId: 1, name: 1, description: 1 },
      sort: {
        name: 1,
      },
    }
  );
  const list: ProjectListItem[] = await toArray(cursor);
  return list;
}

/**
 * Get the list of projects for a struxt admin
 *
 * @returns
 */
export async function getProjectsAdmin() {
  const collection = await getCollection("projects");

  const cursor = collection.find<ModelAsDocument<ProjectModel>>(
    {},
    {
      projection: { projectId: 1, name: 1, description: 1 },
      sort: {
        name: 1,
      },
    }
  );

  const list: ProjectListItem[] = await toArray(cursor);
  return list;
}
