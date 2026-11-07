import { Collection } from "mongodb";
import { CollectionNames, getCollection } from "server/database/mongodb";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { deleteProjectRecords } from "./records";

const collections: CollectionNames[] = [
  "editor_snapshots",
  "project_members",
  "project_members_invites",
  "form_settings",
  "form_submissions",
  "ai_pilot_token_transactions",
  "ai_pilot_token_wallet",
  "assets",
  "projects_published",
  "projects",
];

describe("deleteProjectRecords", () => {
  beforeEach(async () => {
    // Clear collections before each test
    for (const name of collections) {
      const collection = await getCollection(name);
      await collection.deleteMany({});
    }
  });

  test("deletes only the project's application-owned records", async () => {
    const projectId = "project-to-delete";
    const otherProjectId = "other-project";

    for (const name of collections) {
      const collection = await getCollection<{ projectId: string }>(name);
      await collection.insertMany([
        { projectId },
        { projectId: otherProjectId },
      ]);
    }

    const checkpoints = await getCollection<{ projectId: string }>(
      "ai_pilot_checkpoints",
    );
    await checkpoints.insertOne({ projectId });
    const log = vi.fn();

    await deleteProjectRecords(projectId, log);

    for (const name of collections) {
      const collection = await getCollection<{ projectId: string }>(name);
      expect(await collection.countDocuments({ projectId })).toBe(0);
      expect(
        await collection.countDocuments({ projectId: otherProjectId }),
        `Collection: ${name}`,
      ).toBe(1);
      expect(log).toHaveBeenCalledWith(`Collection: ${name} Deleted: 1`);
    }
    expect(await checkpoints.countDocuments({ projectId })).toBe(1);
  });

  test("keeps the project record when an earlier deletion fails", async () => {
    const projectId = "project-to-delete";

    const projects = await getCollection<{ projectId: string }>("projects");
    await projects.insertOne({ projectId });

    const deletion = vi.spyOn(Collection.prototype, "deleteMany");
    deletion.mockRejectedValueOnce(new Error("Deletion failed"));

    try {
      await expect(deleteProjectRecords(projectId, vi.fn())).rejects.toThrow(
        "Deletion failed",
      );
      expect(await projects.countDocuments({ projectId })).toBe(1);
    } finally {
      deletion.mockRestore();
    }
  });
});
