import { customError } from "common/custom-error/custom-error";
import { ModelAsDocument } from "common/models/Model";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { getCollection } from "server/database/mongodb";

/**
 * Get the project editor data from server
 *
 * @param projectId
 */
export async function getProjectEditorData(projectId: string) {
  const collection = await getCollection<ProjectModel>("projects");

  const doc = await collection.findOne(
    {
      projectId,
    },
    {
      projection: { projectId: 1, name: 1, editorData: 1 },
    }
  );

  if (!doc) {
    throw customError(404, "Project not found", "ProjectNotFound");
  }

  return {
    projectId: doc.projectId,
    name: doc.name,
    editorData: doc.editorData,
  };
}

/**
 * Load the entire project details from the database
 *
 * @param projectId
 * @returns
 */
export async function getProjectData(projectId: string) {
  const collection = await getCollection<ProjectModel>("projects");

  const doc = await collection.findOne({
    projectId,
  });

  if (!doc) {
    throw customError(404, "Project not found", "ProjectNotFound");
  }

  return new ProjectModel(doc);
}

/**
 * Check if the given project id is valid
 *
 * @param projectId
 * @returns
 */
export async function checkProjectExists(projectId: string): Promise<boolean> {
  if (!projectId) {
    return false;
  }
  if (projectId.length < 12 || projectId.length > 25) {
    return false;
  }

  const collection = await getCollection("projects");

  const doc = await collection.findOne<ModelAsDocument<ProjectModel>>(
    {
      projectId,
    },
    {
      projection: { projectId: 1 },
    }
  );

  return Boolean(doc);
}
