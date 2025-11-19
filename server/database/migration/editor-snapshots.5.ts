import { createIndex } from "../mongodb";

export async function up() {
  await createIndex(
    "editor_snapshots",
    {
      projectId: 1,
      snapshotTime: 1,
      eventType: 1,
    },
    {
      name: "unique",
      unique: true,
    },
    false
  );

  await createIndex(
    "editor_snapshots",
    { "created.date": 1, "locked.active": 1 },
    {
      name: "purge",
    },
    false
  );
}

export async function down() {}
