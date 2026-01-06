import { postApi } from "client/api/api";
import { EditorSnapshotListApi } from "common/api/projects/editorSnapshots";
import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";

/**
 * Modify a value in the editor snapshot
 *
 * @param projectId
 * @param snapshotTime
 * @param eventType
 * @param change
 * @returns
 */
export async function editEditorSnapshot(
  projectId: string,
  snapshotTime: number,
  eventType: EditorSnapshotModel["eventType"],
  change: EditorSnapshotListApi["PostBody"]["update"]
) {
  const body: EditorSnapshotListApi["PostBody"] = {
    snapshotTime,
    eventType,
    update: change,
  };

  const response = await postApi<EditorSnapshotListApi>(
    ["/api/projects/", projectId, "/snapshots"],
    body
  );

  return response;
}
