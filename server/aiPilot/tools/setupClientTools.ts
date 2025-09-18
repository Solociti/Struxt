import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { ComponentData } from "common/api/aiPilot/eventHelpers";
import z from "zod";

interface ClientTool {
  name: keyof AiPilotChatEvents["serverRequests"];
  description: string;
  schema: z.ZodSchema;
}

const ComponentDataSchema: z.ZodType<ComponentData> = z.lazy(() =>
  z.object({
    type: z
      .string()
      .describe(
        "The type of the component, can be found with get-available-blocks."
      ),
    locked: z
      .boolean()
      .optional()
      .describe("Components that are locked can't be edited."),
    attributes: z
      .record(z.string(), z.string())
      .optional()
      .describe("Component attributes as key-value pairs"),
    style: z
      .record(z.string(), z.string())
      .optional()
      .describe(
        "Optional inline styles for the component as key-value pairs. Keys are CSS properties in snake-case."
      ),
    classes: z
      .array(z.string())
      .optional()
      .describe("Optional list of CSS classes for the component"),
    components: z
      .array(ComponentDataSchema)
      .optional()
      .describe("Optional child components"),
    content: z.string().optional().describe("Text content of the component."),
  })
);

const clientTools: {
  [K in keyof AiPilotChatEvents["serverRequests"]]: Omit<ClientTool, "name">;
} = {
  "list-pages": {
    description: "Get the list of pages in the current project.",
    schema: z.object({}),
  },
  "get-page-html": {
    description: "Get the rendered HTML content of a page.",
    schema: z.object({
      page: z.string().describe("The page ID to get the HTML for"),
    }),
  },

  "list-styles-selectors": {
    description: "Get the list of all CSS selectors in the current project.",
    schema: z.object({}),
  },
  "get-style-by-selector": {
    description: "Get the CSS styles associated with a given CSS selector.",
    schema: z.object({
      selector: z.string().describe("The CSS selector to get the styles for"),
    }),
  },
  "update-style": {
    description:
      "Update CSS styles. Target elements by ID (#elementId) or class (.className). Use 'set' to replace all styles, 'append' to add new ones.",
    schema: z.object({
      css: z
        .string()
        .describe(
          "CSS rules with simple ID (#elementId), class (.className), or pseudo-class selectors only. Example: '#myElement { color: red; }' or '.myClass:hover { margin: 10px; }'"
        ),
      method: z.enum(["set", "append"]),
    }),
  },

  "get-elements": {
    description: "Get HTML elements matching a CSS selector on a page.",
    schema: z.object({
      page: z
        .string()
        .describe(
          "Page ID to get the elements from. Defaults to the selected page."
        ),
      selector: z
        .string()
        .optional()
        .describe(
          "The CSS selector to match. If not provided, all elements will be returned."
        ),
    }),
  },

  "get-component": {
    description:
      "Get component data by ID. Uses selected component if no ID provided.",
    schema: z.object({
      id: z.string().optional(),
    }),
  },

  "add-component": {
    description:
      "Add a new component to a specified page under a given parent component.",
    schema: z.object({
      page: z.string().describe("The page ID to add the component to"),
      parentId: z.string().describe("Parent component ID"),
      component: ComponentDataSchema.describe(
        "The component data to add, including type, attributes, styles, classes, and children"
      ),
    }),
  },

  "add-component-html": {
    description:
      "Add a component using raw HTML under a parent component. Styles can be added as attributes.",
    schema: z.object({
      page: z.string(),
      parentId: z.string(),
      html: z.string(),
    }),
  },

  "delete-component": {
    description: "Delete a component by its ID.",
    schema: z.object({
      id: z.string(),
    }),
  },

  "move-component": {
    description:
      "Move a component to a new parent component, optionally specifying its position among siblings.",
    schema: z.object({
      id: z.string(),
      newParentId: z.string(),
      position: z.number().int().min(0).optional(),
    }),
  },

  "get-available-blocks": {
    description: "Get available blocks in the editor.",
    schema: z.object({}),
  },

  "get-traits": {
    description:
      "Get component properties by ID. Uses selected component if no ID provided.",
    schema: z.object({
      componentId: z.string().optional(),
    }),
  },

  "get-layers": {
    description:
      "Get the layer structure of a page. Uses selected page if no ID provided.",
    schema: z.object({
      page: z.string().optional(),
    }),
  },
};

/**
 * Get the list of tools that the AI agents can request from the client
 *
 * @returns
 */
export async function getClientTools(): Promise<ClientTool[]> {
  // ! this function is async to allow for future description fetching if needed

  return Object.entries(clientTools).map(([name, info]) => ({
    name: name as keyof AiPilotChatEvents["serverRequests"],
    ...info,
  }));
}
