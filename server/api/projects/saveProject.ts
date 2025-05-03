import { customError } from "common/custom-error/custom-error";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { getCollection } from "server/database/mongodb";

/**
 * save the project editor data to database
 *
 * @param projectId
 * @param editorData
 */
export async function saveProjectEditorData(
  projectId: string,
  editorData: any
) {
  const collection = await getCollection("projects");

  // save the project editor data to database
  const result = await collection.updateOne(
    {
      projectId,
    },
    {
      $set: {
        editorData,
      },
    }
  );

  if (result.matchedCount === 0) {
    throw customError(404, "Project not found");
  }

  return {
    success: true,
  };
}

/**
 * Save the given project model to the database.
 *
 * @param project
 * @returns
 */
export async function saveProject(
  project: ProjectModel
): Promise<{ success: boolean }> {
  const collection = await getCollection("projects");

  // save the project to database
  await collection.updateOne(
    {
      projectId: project.projectId,
    },
    {
      $set: project,
    },
    {
      upsert: true,
    }
  );

  return {
    success: true,
  };
}
