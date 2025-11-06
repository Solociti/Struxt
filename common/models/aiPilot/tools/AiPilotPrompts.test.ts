import { beforeEach, describe, expect, test, vi } from "vitest";
import { AiPilotPrompts } from "./AiPilotPrompts";
import { PromptOverrides } from "./PromptOverrides";

describe("AiPilotPrompts", () => {
  test("should initialize with default values", () => {
    const model = new AiPilotPrompts();

    expect(Object.keys(model)).toEqual(["agentPrompt", "tools", "schemas"]);

    expect(model.agentPrompt).toBeTypeOf("string");

    expect(model.tools).toBeTypeOf("object");
    expect(Object.keys(model.tools)).toEqual([
      "list-project-memories",
      "get-project-memory",
      "search-project-memories",
      "get-memories-by-type",
      "save-project-memory",
      "archive-project-memory",
      "list-pages",
      "get-page-html",
      "list-styles-selectors",
      "get-style-by-selector",
      "update-style",
      "get-elements",
      "get-component",
      "add-component",
      "add-component-html",
      "delete-component",
      "move-component",
      "get-available-blocks",
      "get-traits",
      "get-layers",
    ]);
    for (const key in model.tools) {
      expect(model.tools[key as keyof typeof model.tools]).toBeTypeOf("string");
    }

    expect(model.schemas).toBeTypeOf("object");
    expect(Object.keys(model.schemas)).toEqual([
      "get-page-html.pageId",
      "get-style-by-selector.selector",
      "update-style.css",
      "get-elements.pageId",
      "get-elements.selector",
      "add-component.pageId",
      "add-component.parentId",
      "add-component.component",
      "add-component.component.type",
      "add-component.component.locked",
      "add-component.component.attributes",
      "add-component.component.style",
      "add-component.component.classes",
      "add-component.component.components",
      "add-component.component.content",
    ]);
    for (const key in model.schemas) {
      expect(model.schemas[key as keyof typeof model.schemas]).toBeTypeOf(
        "string"
      );
    }
  });

  test("should initialize with provided data", () => {
    const model = new AiPilotPrompts({
      agentPrompt: "Custom prompt",
      tools: {
        "add-component": "Description for tool.",
      },
      schemas: {
        "add-component.pageId": "Page ID.",
      },
    });

    expect(model.agentPrompt).toBe("Custom prompt");
    expect(model.tools["add-component"]).toBe("Description for tool.");
    expect(model.schemas["add-component.pageId"]).toBe("Page ID.");
  });

  test("should clone the model correctly", () => {
    const model = new AiPilotPrompts();

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(AiPilotPrompts);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });

  describe("AiPilotPrompts Methods", () => {
    test("getTool should return the correct tool description", () => {
      const model = new AiPilotPrompts();

      const toolDescription = model.getTool("add-component");
      expect(toolDescription).toBe(
        "Add a new component to a specified page under a given parent component."
      );
    });

    test("getSchema should return the correct schema description", () => {
      const model = new AiPilotPrompts();

      const schemaDescription = model.getSchema("add-component.pageId");
      expect(schemaDescription).toBe("The page ID to add the component to");
    });

    test("getSchema should return an empty string for unknown keys", () => {
      const model = new AiPilotPrompts();

      const schemaDescription = model.getSchema("unknown.key" as any);
      expect(schemaDescription).toBe("");
    });
  });

  describe("PromptOverrides", () => {
    let model = new AiPilotPrompts();
    const overrides = [
      new PromptOverrides({
        key: "agentPrompt",
        prompt: "Overridden agent prompt",
        vendors: [],
        models: [],
      }),
      new PromptOverrides({
        key: "agentPrompt",
        prompt: "Vendor specific prompt",
        vendors: ["vendor-1"],
        models: [],
      }),
      new PromptOverrides({
        key: "agentPrompt",
        prompt: "Agent specific prompt",
        vendors: [],
        models: ["agent-1"],
      }),
    ];

    beforeEach(() => {
      model = new AiPilotPrompts();
    });

    test("default value should override", () => {
      model.applyOverrides(overrides, "", "");

      expect(model.agentPrompt).toBe("Overridden agent prompt");
    });

    test("default value should override when vendor and agent don't have a match", () => {
      model.applyOverrides(overrides, "vendor-2", "agent-2");

      expect(model.agentPrompt).toBe("Overridden agent prompt");
    });

    test("vendor-specific override should apply", () => {
      model.applyOverrides(overrides, "vendor-1", "agent-2");

      expect(model.agentPrompt).toBe("Vendor specific prompt");
    });

    test("agent-specific override should apply", () => {
      model.applyOverrides(overrides, "vendor-2", "agent-1");

      expect(model.agentPrompt).toBe("Agent specific prompt");
    });

    test("both vendor and agent-specific overrides should apply, with agent taking precedence", () => {
      model.applyOverrides(overrides, "vendor-1", "agent-1");

      expect(model.agentPrompt).toBe("Agent specific prompt");
    });

    test("both vendor and agent-specific overrides should apply, with agent taking precedence", () => {
      const mockApplyOverride = vi.fn();

      // Create spy overrides to track calls
      const spyOverrides = overrides.map((override) => {
        const _ovr = override.clone();
        _ovr.applyOverride = mockApplyOverride;
        return _ovr;
      });

      model.applyOverrides(spyOverrides as any, "vendor-1", "agent-1");

      expect(mockApplyOverride).toHaveBeenCalledTimes(3);
    });
  });
});
