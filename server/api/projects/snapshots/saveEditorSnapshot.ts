import { EditorData } from "common/models/projects/editorDataTypes";
import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";
import { getCollection } from "server/database/mongodb";
import { getCompactDate, validEventTypes } from "./snapshotUtils";

/**
 * Creates a new editor snapshot for a project
 *
 * @param editorData
 * @param user
 */
export async function createEditorSnapshot(
  projectId: string,
  eventType: EditorSnapshotModel["eventType"],
  editorData: EditorData,
  user: { userId: string; displayName: string },
  snapshotTime?: number
) {
  if (!validEventTypes.includes(eventType)) {
    throw new Error(`Invalid event type: ${eventType}`);
  }
  if (!projectId) {
    throw new Error("Project id is required");
  }

  // get the snapshot time to use
  if (typeof snapshotTime === "number" && snapshotTime > 0) {
    snapshotTime = getCompactDate(snapshotTime, eventType);
  } else {
    snapshotTime = getCompactDate(Date.now() / 1000, eventType);
  }

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
  return await saveEditorSnapshot(snapshot);
}

/**
 * Saves the given editor snapshot to the database
 *
 * @param snapshot
 * @returns
 */
export async function saveEditorSnapshot(snapshot: EditorSnapshotModel) {
  const collection = await getCollection<EditorSnapshotModel>(
    "editor_snapshots"
  );

  const result = await collection.updateOne(
    {
      projectId: snapshot.projectId,
      snapshotTime: snapshot.snapshotTime,
      eventType: snapshot.eventType,
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
