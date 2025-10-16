import { beforeEach, describe, expect, test } from "vitest";
import { PromptOverrides } from "./PromptOverrides";

describe("PromptOverrides", () => {
  test("should initialize with default values", () => {
    const date = Math.floor(Date.now() / 1000);

    const promptOverrides = new PromptOverrides();

    expect(promptOverrides.created.date).toBeGreaterThanOrEqual(date);
    expect(promptOverrides.updated.date).toBeGreaterThanOrEqual(date);

    promptOverrides.created.date = 1234;
    promptOverrides.updated.date = 1234;

    expect(promptOverrides).toEqual({
      archived: {
        active: false,
        date: 0,
        displayName: "",
        userId: "",
      },
      created: {
        date: 1234,
        displayName: "",
        userId: "",
      },
      key: "agentPrompt",
      models: [],
      prompt: "",
      updated: {
        date: 1234,
        displayName: "",
        userId: "",
      },
      uuid: "",
      vendors: [],
    });
  });

  test("should initialize with provided data", () => {
    const promptOverrides = new PromptOverrides({
      created: {
        date: 1234,
        userId: "user-1",
        displayName: "User 1",
      },
      updated: {
        date: 1234,
      },
      key: "add-component",
      prompt: "Add component prompt",
    });

    expect(promptOverrides).toEqual({
      archived: {
        active: false,
        date: 0,
        displayName: "",
        userId: "",
      },
      created: {
        date: 1234,
        displayName: "User 1",
        userId: "user-1",
      },
      key: "add-component",
      models: [],
      prompt: "Add component prompt",
      updated: {
        date: 1234,
        displayName: "",
        userId: "",
      },
      uuid: "",
      vendors: [],
    });
  });

  test("should clone the model correctly", () => {
    const promptOverrides = new PromptOverrides();

    const cloned = promptOverrides.clone();

    expect(cloned).toBeInstanceOf(PromptOverrides);
    expect(cloned).not.toBe(promptOverrides);

    expect(cloned).toEqual(promptOverrides);
  });

  describe("Is Methods", () => {
    let defModel = new PromptOverrides();
    let vendorModel = new PromptOverrides();
    let modelModel = new PromptOverrides();
    let bothModel = new PromptOverrides();

    beforeEach(() => {
      defModel = new PromptOverrides();
      vendorModel = new PromptOverrides({
        vendors: ["vendor-1"],
      });
      modelModel = new PromptOverrides({
        models: ["model-1"],
      });
      bothModel = new PromptOverrides({
        vendors: ["vendor-1"],
        models: ["model-1"],
      });
    });

    test("should check if default override", () => {
      expect(defModel.isDefault()).toBe(true);
      expect(vendorModel.isDefault()).toBe(false);
      expect(modelModel.isDefault()).toBe(false);
      expect(bothModel.isDefault()).toBe(false);
    });

    test("should check if vendor matches", () => {
      expect(defModel.isVendorMatch("vendor-1")).toBe(false);
      expect(vendorModel.isVendorMatch("vendor-1")).toBe(true);
      expect(vendorModel.isVendorMatch("vendor-2")).toBe(false);
      expect(modelModel.isVendorMatch("vendor-1")).toBe(false);
      expect(bothModel.isVendorMatch("vendor-1")).toBe(true);
      expect(bothModel.isVendorMatch("vendor-2")).toBe(false);
    });

    test("should check if model matches", () => {
      expect(defModel.isModelMatch("model-1")).toBe(false);
      expect(vendorModel.isModelMatch("model-1")).toBe(false);
      expect(modelModel.isModelMatch("model-1")).toBe(true);
      expect(modelModel.isModelMatch("model-2")).toBe(false);
      expect(bothModel.isModelMatch("model-1")).toBe(true);
      expect(bothModel.isModelMatch("model-2")).toBe(false);
    });
  });
});
