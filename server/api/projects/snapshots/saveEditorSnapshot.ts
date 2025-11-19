import { EditorData } from "common/models/projects/editorDataTypes";
import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";
import { getCollection } from "server/database/mongodb";
import { getCompactDate, validEventTypes } from "./snapshotUtils";

/**
 * Saves an editor snapshot for a project
 *
 * @param editorData
 * @param user
 */
export async function saveEditorSnapshot(
  projectId: string,
  eventType: EditorSnapshotModel["eventType"],
  editorData: EditorData,
  user: { userId: string; displayName: string }
) {
  if (!validEventTypes.includes(eventType)) {
    throw new Error(`Invalid event type: ${eventType}`);
  }
  if (!projectId) {
    throw new Error("Project id is required");
  }

  // get the snapshot time to use
  const snapshotTime = getCompactDate(Date.now() / 1000);

  // setup the new snapshot data
  const snapshot = new EditorSnapshotModel({
    projectId,
    snapshotTime,
    eventType,
    created: {
      ...user,
    },
    editorData: editorData,
  });

  // save the snapshot to database
  const collection = await getCollection("editor_snapshots");

  const result = await collection.updateOne(
    {
      projectId,
      snapshotTime,
      eventType,
    },
    {
      $set: snapshot,
    },
    {
      upsert: true,
    }
  );

  return {
    snapshot,
    isNew: result.upsertedCount === 1,
  };
}
