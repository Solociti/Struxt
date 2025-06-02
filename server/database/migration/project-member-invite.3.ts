import { createIndex } from "../mongodb";

export async function up() {
  await createIndex(
    "project_members_invites",
    {
      inviteId: 1,
    },
    {
      name: "inviteId",
      unique: true,
    },
    false
  );
}

export async function down() {}
