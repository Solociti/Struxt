import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, test } from "vitest";

process.env.MONGODB_PREFIX = `struxt_test_${randomUUID().toString().replace(/-/g, "")}`;

const { getDb } = await import("./mongodb");

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
