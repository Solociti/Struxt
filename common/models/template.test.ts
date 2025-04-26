import { describe, expect, test } from "vitest";
import { Model } from "./Model";

describe("Model", () => {
  test("should initialize with default values", () => {
    const model = new Model();

    expect(model).toEqual({});
  });

  test("should initialize with provided data", () => {
    const model = new Model();

    expect(model).toEqual({});
  });

  test("should clone the model correctly", () => {
    const model = new Model();

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(Model);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
