import {
  EditorSnapshotListItem,
  EditorSnapshotModel,
} from "common/models/projects/EditorSnapshot";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Get the list of snapshots for a project
 *
 * @param projectId
 * @returns
 */
export async function getEditorSnapshots(projectId: string) {
  const collection = await getCollection<EditorSnapshotModel>(
    "editor_snapshots"
  );

  const projection: Record<keyof EditorSnapshotListItem, 1 | 0 | boolean> = {
    projectId: 1,
    snapshotTime: 1,
    eventType: 1,
    created: 1,
    locked: 1,
  };

  const cursor = await collection.find(
    {
      projectId,
    },
    {
      projection,
      sort: {
        snapshotTime: -1,
      },
    }
  );

  const docs = await toArray(cursor);
  return docs.map((doc) => doc as EditorSnapshotListItem);
}
