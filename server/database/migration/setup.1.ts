import { createIndex } from "../mongodb";

export async function up() {
  await createIndex(
    "projects",
    true,
    "",
    {
      projectId: 1,
    },
    {
      name: "projectId",
      unique: true,
    },
    false
  );
}

export async function down() {}
