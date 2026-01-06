import { createIndex } from "../mongodb";

export async function up() {
  await createIndex(
    "routines",
    {
      uuid: 1,
    },
    {
      name: "unique",
      unique: true,
    },
    false
  );

  await createIndex(
    "routines",
    {
      projectId: 1,
      path: 1,
      name: 1,
    },
    {
      name: "unique-file",
      unique: true,
    },
    false
  );
}

export async function down() {}
