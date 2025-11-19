import { describe, expect, test } from "vitest";
import { EditorSnapshotModel } from "./EditorSnapshot";

describe("EditorSnapshotModel", () => {
  test("should initialize with default values", () => {
    const model = new EditorSnapshotModel();

    expect(model.created.date).toBeLessThanOrEqual(Date.now() / 1000);

    expect(model).toEqual({
      created: {
        date: expect.any(Number),
        displayName: "",
        userId: "",
      },
      editorData: {
        assets: [],
        custom: {
          id: "",
          projectType: "site",
        },
        dataSources: [],
        pages: [],
        styles: [],
        symbols: [],
      },
      locked: {
        active: false,
        date: 0,
        displayName: "",
        userId: "",
      },
      projectId: "",
      eventType: "save",
      restored: {
        active: false,
        date: 0,
        displayName: "",
        userId: "",
      },
      snapshotTime: 0,
    });
  });

  test("should initialize with provided data", () => {
    const model = new EditorSnapshotModel({
      created: {
        date: 123456,
        userId: "u-1",
        displayName: "User 1",
      },
      // editor data should not get transformed
      editorData: {
        assets: [{}],
      },
    });

    expect(model).toEqual({
      created: {
        date: 123456,
        userId: "u-1",
        displayName: "User 1",
      },
      editorData: {
        assets: [{}],
      },
      locked: {
        active: false,
        date: 0,
        displayName: "",
        userId: "",
      },
      projectId: "",
      eventType: "save",
      restored: {
        active: false,
        date: 0,
        displayName: "",
        userId: "",
      },
      snapshotTime: 0,
    });
  });

  test("should clone the model correctly", () => {
    const model = new EditorSnapshotModel();

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(EditorSnapshotModel);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
