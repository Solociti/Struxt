import { ToolKeys } from "common/api/aiPilot/toolNames";
import { Model } from "common/models/Model";
import { DeepPartial, mergeDeep } from "common/models/utils";
import { PromptOverrides } from "./PromptOverrides";

export class AiPilotPrompts extends Model {
  public agentPrompt: string = [
    "You are an AI assistant specializing in web development and digital marketing for a drag-and-drop website builder (Struxt - a modified version of GrapesJS).",
    "Help users create and optimize websites through code generation, SEO, UX design, and content strategy.",
    "You're open to discussing any concept that might inspire web projects.",
    "Before responding, check project memories for existing preferences and standards, then save any new important project information using the appropriate type (facts, preferences, decisions, context, style).",
  ].join("\n");

  public tools: Record<ToolKeys, string> = {
    "list-project-memories":
      "List all memory keys stored for the current project. Use this to see what information has been saved about the project.",
    "get-project-memory":
      "Get project memories by key using regexp. Use this to recall specific information about the project.",
    "search-project-memories":
      "Search project memories by content and/or type. Use query to search in keys/values, use type to filter by memory category (facts, preferences, decisions, context, style).",
    "get-memories-by-type":
      "Get all project memories of a specific type (facts, preferences, decisions, context, style). Use this to recall specific categories of information.",
    "save-project-memory":
      "Save important information about the project for future reference. Always use this when you learn something important about the project: style preferences, brand voice, target audience, technical requirements, design decisions, user feedback, etc.",
    "archive-project-memory":
      "Archive a memory entry when it's no longer relevant or accurate.",

    "list-pages": "Get the list of pages in the current project.",
    "get-page-html": "Get the rendered HTML content of a page.",

    "list-styles-selectors":
      "Get the list of all CSS selectors in the current project.",
    "get-style-by-selector":
      "Get the CSS styles associated with a given CSS selector.",
    "update-style":
      "Update CSS styles. Target elements by ID (#elementId) or class (.className). Use 'set' to replace all styles, 'append' to add new ones.",

    "get-elements": "Get HTML elements matching a CSS selector on a page.",

    "get-component":
      "Get component data by ID. Uses selected component if no ID provided.",

    "add-component":
      "Add a new component to a specified page under a given parent component.",

    "add-component-html":
      "Add a component using raw HTML under a parent component. Styles can be added as attributes.",

    "delete-component": "Delete a component by its ID.",

    "move-component":
      "Move a component to a new parent component, optionally specifying its position among siblings.",

    "get-available-blocks": "Get available blocks in the editor.",

    "get-traits":
      "Get component properties by ID. Uses selected component if no ID provided.",

    "get-layers":
      "Get the layer structure of a page. Uses selected page if no ID provided.",
  };

  public schemas = {
    "get-page-html.pageId": "The page ID to get the HTML for",
    "get-style-by-selector.selector": "The CSS selector to get the styles for",
    "update-style.css":
      "CSS rules with simple ID (#elementId), class (.className), or pseudo-class selectors only. Example: '#myElement { color: red; }' or '.myClass:hover { margin: 10px; }'",
    "get-elements.pageId":
      "Page ID to get the elements from. Defaults to the selected page.",
    "get-elements.selector":
      "The CSS selector to match. If not provided, all elements will be returned.",
    "add-component.pageId": "The page ID to add the component to",
    "add-component.parentId": "Parent component ID",
    "add-component.component":
      "The component data to add, including type, attributes, styles, classes, and children",
    "add-component.component.type":
      "The type of the component, can be found with get-available-blocks.",
    "add-component.component.locked":
      "Components that are locked can't be edited.",
    "add-component.component.attributes":
      "Component attributes as key-value pairs",
    "add-component.component.style":
      "Optional inline styles for the component as key-value pairs. Keys are CSS properties in snake-case.",
    "add-component.component.classes":
      "Optional list of CSS classes for the component",
    "add-component.component.components": "Optional child components",
    "add-component.component.content": "Text content of the component.",
  };

  constructor(data?: DeepPartial<AiPilotPrompts>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<AiPilotPrompts>) {
    mergeDeep(this, data);
  }

  clone() {
    return new AiPilotPrompts(JSON.parse(JSON.stringify(this)));
  }

  /**
   * Get the description for a specific tool
   *
   * @param toolName
   * @param model Optionally provide the model name for model-specific descriptions
   * @returns
   */
  getTool(toolName: ToolKeys) {
    return this.tools[toolName];
  }

  /**
   * Get the schema description for a specific tool parameter
   *
   * @param key
   * @returns
   */
  getSchema(key: keyof typeof this.schemas) {
    return this.schemas[key] || "";
  }

  /**
   * Get the prompt for a specific key.
   *
   * @param key
   * @returns
   */
  getPrompt(key: PromptOverrides["key"]) {
    if (key === "agentPrompt") {
      return this.agentPrompt;
    } else if (key in this.tools) {
      return this.getTool(key as ToolKeys);
    } else if (key in this.schemas) {
      return this.getSchema(key as keyof typeof this.schemas);
    }

    return "";
  }

  /**
   * Apply the list of overrides to the current prompts
   *
   * @param overrides
   * @param vendor the llm vendor to apply overrides for
   * @param model the llm model to apply overrides for
   */
  applyOverrides(overrides: PromptOverrides[], vendor: string, model: string) {
    // apply default overrides first
    for (const ovr of overrides) {
      if (ovr.isDefault()) {
        ovr.applyOverride(this);
      }
    }

    // apply all vendor overrides first
    for (const ovr of overrides) {
      if (ovr.isVendorMatch(vendor)) {
        ovr.applyOverride(this);
      }
    }

    // then apply all model overrides
    for (const ovr of overrides) {
      if (ovr.isModelMatch(model)) {
        ovr.applyOverride(this);
      }
    }
  }
}
