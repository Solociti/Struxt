import { customError } from "common/custom-error/custom-error";
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
