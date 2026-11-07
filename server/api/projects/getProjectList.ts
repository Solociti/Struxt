import { ProjectListFilter } from "common/api/projects/project";
import { DataPropsOnly, ModelAsDocument } from "common/models/Model";
import { ProjectListItem } from "common/models/projects/ProjectItem";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { ProjectRoleDocument } from "common/models/projects/ProjectRoles";
import { Filter } from "mongodb";
import { getCollection, toArray } from "server/database/mongodb";

function applyFilter(
  filter: ProjectListFilter,
  query: Filter<DataPropsOnly<ProjectModel>>,
) {
  if (filter.search) {
    query.name = { $regex: filter.search, $options: "i" };
  }

  if (filter.showDeleted) {
    query["deleted.active"] = true;
  } else {
    query["deleted.active"] = { $ne: true };
  }

  return query;
}

/**
 * Get the list of project ids that a user has access to
 *
 * @param userId
 * @returns
 */
async function getUserProjectIds(userId: string) {
  const collection = await getCollection("project_members");

  const cursor = collection.find<ModelAsDocument<ProjectRoleDocument>>(
    { userId, "deleted.active": { $ne: true } },
    {
      projection: { projectId: 1 },
    },
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
 * @param filter
 * @returns
 */
export async function getProjectsForUser(
  userId: string,
  filter: ProjectListFilter,
) {
  // get the list of project ids for the user
  const projectIds = await getUserProjectIds(userId);

  const collection = await getCollection<ProjectModel>("projects");

  const query = applyFilter(filter, { projectId: { $in: projectIds } });

  const cursor = collection.find(query, {
    projection: { projectId: 1, name: 1, description: 1 },
    sort: {
      name: 1,
    },
    limit: filter.count,
    skip: (filter.page - 1) * filter.count,
  });
  const list: ProjectListItem[] = await toArray(cursor);

  // count the total results
  const total = await collection.countDocuments(query);

  return { list, total };
}

/**
 * Get the list of projects for a struxt admin
 *
 * @param filter
 * @returns
 */
export async function getProjectsAdmin(filter: ProjectListFilter) {
  const collection = await getCollection<ProjectModel>("projects");

  const query = applyFilter(filter, {});

  const cursor = collection.find(query, {
    projection: { projectId: 1, name: 1, description: 1 },
    sort: {
      name: 1,
    },
    limit: filter.count,
    skip: (filter.page - 1) * filter.count,
  });

  const list: ProjectListItem[] = await toArray(cursor);
  const total = await collection.countDocuments(query);

  return { list, total };
}
