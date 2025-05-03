import { describe, expect, test } from "vitest";
import { PublishModel } from "./PublishModel";

describe("PublishModel", () => {
  test("should initialize with default values", () => {
    const model = new PublishModel();

    expect(model.created.date).toBeCloseTo(Math.floor(Date.now() / 1000), 5);
    model.created.date = 0; // Set to a fixed value for comparison

    expect(model).toEqual({
      uuid: "",
      projectId: "",
      siteEnv: "staging",
      isActive: false,
      screenshotUrl: "",
      created: { date: 0, userId: "", displayName: "" },
    });
  });

  test("should initialize with provided data", () => {
    const model = new PublishModel({
      created: {
        date: 1234,
      },
      projectId: "test-project",
    });

    expect(model).toEqual({
      uuid: "",
      projectId: "test-project",
      siteEnv: "staging",
      isActive: false,
      screenshotUrl: "",
      created: { date: 1234, userId: "", displayName: "" },
    });
  });

  test("should clone the model correctly", () => {
    const model = new PublishModel();

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(PublishModel);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
