import { EditorSnapshotListApi } from "common/api/projects/editorSnapshots";
import { customError } from "common/custom-error/custom-error";
import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";
import { getEditorSnapshot } from "./getEditorSnapshots";
import { saveEditorSnapshot } from "./saveEditorSnapshot";

/**
 * Modify a value in the editor snapshot
 *
 * @param projectId
 * @param snapshotTime
 * @param eventType
 * @param change
 * @param user
 * @returns
 */
export async function editSnapshot(
  projectId: string,
  snapshotTime: number,
  eventType: EditorSnapshotModel["eventType"],
  change: EditorSnapshotListApi["PostBody"]["update"],
  user: { userId: string; displayName: string }
) {
  const snapshot = await getEditorSnapshot(projectId, snapshotTime, eventType);
  if (!snapshot) {
    throw customError(404, "Snapshot not found.");
  }

  switch (change.key) {
    case "locked.active":
      if (change.value) {
        snapshot.locked = {
          ...snapshot.locked,
          ...user,
          active: true,
          date: Math.floor(Date.now() / 1000),
        };
      } else {
        snapshot.locked = {
          ...snapshot.locked,
          ...user,
          active: false,
          date: 0,
        };
      }
      break;

    default:
      throw customError(400, "Invalid update key.");
  }

  await saveEditorSnapshot(snapshot);

  return snapshot;
}
