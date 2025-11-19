import { postApi } from "client/api/api";
import { EditorSnapshotRestoreApi } from "common/api/projects/editorSnapshots";
import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";

/**
 * Restore an editor snapshot for a project
 *
 * @param projectId
 * @param snapshotTime
 * @param eventType
 * @returns
 */
export async function restoreEditorSnapshot(
  projectId: string,
  snapshotTime: number,
  eventType: EditorSnapshotModel["eventType"]
) {
  const body: EditorSnapshotRestoreApi["PostBody"] = {
    snapshotTime,
    eventType,
  };

  const response: EditorSnapshotRestoreApi["PostResponse"] = await postApi(
    ["/api/projects/", projectId, "/snapshots/restore"],
    body
  );

  return response;
}
