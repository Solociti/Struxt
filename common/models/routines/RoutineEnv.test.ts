import { describe, expect, test } from "vitest";
import { RoutineEnvModel } from "./RoutineEnv";

describe("RoutineEnvironment", () => {
  test("should initialize with default values", () => {
    const model = new RoutineEnvModel();

    expect(model).toEqual({
      uuid: "",
      name: "",
      displayName: "",
      runtime: "nodejs",
      isDefault: false,
      files: [],
      ignore: [],
      disabled: {
        active: false,
        date: 0,
      },
    });
  });

  test("should initialize with provided data", () => {
    const model = new RoutineEnvModel({
      uuid: "abc-123",
      name: "my-env",
      displayName: "My Environment",
      runtime: "nodejs",
      isDefault: true,
      files: ["index.js", "package.json"],
    });

    expect(model).toEqual({
      uuid: "abc-123",
      name: "my-env",
      displayName: "My Environment",
      runtime: "nodejs",
      isDefault: true,
      files: ["index.js", "package.json"],
      ignore: [],
      disabled: {
        active: false,
        date: 0,
      },
    });
  });

  test("should clone the model correctly", () => {
    const model = new RoutineEnvModel({
      uuid: "abc-123",
      name: "my-env",
    });

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(RoutineEnvModel);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
