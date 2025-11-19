import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";
import { saveProjectEditorData } from "../saveProject";
import { createEditorSnapshot, saveEditorSnapshot } from "./saveEditorSnapshot";
import { getProjectData } from "../getProject";

/**
 * Restore a editor snapshot for a project
 *
 * @param snapshot
 */
export async function restoreSnapshot(
  snapshot: EditorSnapshotModel,
  user: { userId: string; displayName: string }
): Promise<boolean> {
  const project = await getProjectData(snapshot.projectId);

  // create a new snapshot for the project
  await createEditorSnapshot(
    snapshot.projectId,
    "restore",
    project.editorData,
    user
  );

  // set the restored date
  snapshot.restored = {
    ...snapshot.restored,
    ...user,
    active: true,
    date: Math.floor(Date.now() / 1000),
  };

  await saveEditorSnapshot(snapshot);
  await saveProjectEditorData(snapshot.projectId, snapshot.editorData);

  return true;
}
