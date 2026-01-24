import { AssetModel } from "common/models/assets/AssetModel";
import { getCollection } from "server/database/mongodb";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { isAssetPathUnique } from "./assetPathOps";

describe("isAssetPathUnique", () => {
  const projectId = "0001-test";

  beforeEach(async () => {
    // Insert a conflicting asset for the test case
    const assets = await getCollection("assets");
    await assets.insertOne(
      new AssetModel({
        projectId,
        path: "/public/assets/bbq-chicken.jpg",
        uuid: "existing-uuid",
        displayName: "bbq-chicken.jpg",
        size: 1024,
      }),
    );
  });

  afterAll(async () => {
    // Cleanup
    const assets = await getCollection("assets");
    await assets.deleteMany({ projectId });
  });

  test('should return true for path: "/public/assets/logo.png"', async () => {
    const result = await isAssetPathUnique(
      projectId,
      "",
      "/public/assets/logo.png",
    );
    expect(result).toBe(true);
  });

  test('should return false for path: "/public/assets"', async () => {
    const result = await isAssetPathUnique(projectId, "", "/public/assets");
    expect(result).toBe(false);
  });

  test('should return false for path: "/public/assets/bbq-chicken.jpg"', async () => {
    const result = await isAssetPathUnique(
      projectId,
      "",
      "/public/assets/bbq-chicken.jpg",
    );
    expect(result).toBe(false);
  });

  test('should return false for path: "/routines/"', async () => {
    const result = await isAssetPathUnique(projectId, "", "/routines/");
    expect(result).toBe(false);
  });

  test('should return false for path: "/external/"', async () => {
    const result = await isAssetPathUnique(projectId, "", "/external/");
    expect(result).toBe(false);
  });

  test('should return true for path: "/routines/test.js"', async () => {
    const result = await isAssetPathUnique(projectId, "", "/routines/test.js");
    expect(result).toBe(true);
  });

  test('should return false for path: "/.trash/test.js"', async () => {
    const result = await isAssetPathUnique(projectId, "", "/.trash/test.js");
    expect(result).toBe(false);
  });

  test('should return false for path: "/.trash/"', async () => {
    const result = await isAssetPathUnique(projectId, "", "/.trash/");
    expect(result).toBe(false);
  });
});
