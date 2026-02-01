import { getDb } from "./mongodb";
import { beforeEach, describe, expect, test } from "vitest";

// Since we are using a shared global Mongodb instance,
// we should clear the database collections between tests to ensure isolation.
beforeEach(async () => {
  const db = await getDb();
  const collections = await db.collections();

  for (const collection of collections) {
    // Don't drop system collections
    if (collection.collectionName.startsWith("system.")) continue;
    await collection.deleteMany({});
  }
});

describe("Mongodb Setup", () => {
  test("should connect to the database", async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });
});
