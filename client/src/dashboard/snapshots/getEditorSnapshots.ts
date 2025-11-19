import { getApi } from "client/api/api";
import { EditorSnapshotListApi } from "common/api/projects/editorSnapshots";

/**
 * Get the list of snapshots for a project
 *
 * @param projectId
 * @returns
 */
export async function getEditorSnapshots(projectId: string) {
  const response: EditorSnapshotListApi["GetResponse"] = await getApi([
    "/api/projects/",
    projectId,
    "/snapshots",
  ]);

  return response.list;
}
