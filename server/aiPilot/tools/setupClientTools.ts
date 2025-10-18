import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { ComponentData } from "common/api/aiPilot/eventHelpers";
import { ToolKeys } from "common/api/aiPilot/toolNames";
import { AiPilotPrompts } from "common/models/aiPilot/tools/AiPilotPrompts";
import z from "zod";

interface ClientTool {
  name: keyof AiPilotChatEvents["serverRequests"];
  description: string;
  schema: z.ZodSchema;

  geminiSchema?: z.ZodSchema;
}

/**
 * Get the list of tools that the AI agents can request from the client
 *
 * @returns
 */
export function getClientTools(
  model: string,
  description: AiPilotPrompts
): ClientTool[] {
  const setupComponentSchema = (component: any) => {
    return z.object({
      type: z
        .string()
        .describe(description.getSchema("add-component.component.type")),
      locked: z
        .boolean()
        .optional()
        .describe(description.getSchema("add-component.component.locked")),
      attributes: z
        .looseObject({})
        .optional()
        .describe(description.getSchema("add-component.component.attributes")),
      style: z
        .looseObject({})
        .optional()
        .describe(description.getSchema("add-component.component.style")),
      classes: z
        .array(z.string())
        .optional()
        .describe(description.getSchema("add-component.component.classes")),
      components: z
        .array(component)
        .optional()
        .describe(description.getSchema("add-component.component.components")),
      content: z
        .string()
        .optional()
        .describe(description.getSchema("add-component.component.content")),
    });
  };

  const ComponentDataSchema: z.ZodType<ComponentData> = z.lazy(() =>
    setupComponentSchema(ComponentDataSchema)
  );

  const clientTools: {
    [K in keyof AiPilotChatEvents["serverRequests"]]: Omit<
      ClientTool,
      "name" | "description"
    >;
  } = {
    "list-pages": {
      schema: z.object({}),
    },
    "get-page-html": {
      schema: z.object({
        pageId: z
          .string()
          .describe(description.getSchema("get-page-html.pageId")),
      }),
    },

    "list-styles-selectors": {
      schema: z.object({}),
    },
    "get-style-by-selector": {
      schema: z.object({
        selector: z
          .string()
          .describe(description.getSchema("get-style-by-selector.selector")),
      }),
    },
    "update-style": {
      schema: z.object({
        css: z.string().describe(description.getSchema("update-style.css")),
        method: z.enum(["set", "merge"]),
      }),
    },

    "get-elements": {
      schema: z.object({
        page: z.string().describe(description.getSchema("get-elements.pageId")),
        selector: z
          .string()
          .optional()
          .describe(description.getSchema("get-elements.selector")),
      }),
    },

    "get-component": {
      schema: z.object({
        id: z.string().optional(),
      }),
    },

    "add-component": {
      schema: z.object({
        page: z
          .string()
          .describe(description.getSchema("add-component.pageId")),
        parentId: z
          .string()
          .describe(description.getSchema("add-component.parentId")),
        component: ComponentDataSchema.describe(
          description.getSchema("add-component.component")
        ),
        position: z.number().int().min(0).optional(),
      }),
      geminiSchema: z.object({
        page: z
          .string()
          .describe(description.getSchema("add-component.pageId")),
        parentId: z
          .string()
          .describe(description.getSchema("add-component.parentId")),
        component: setupComponentSchema(z.object({})).describe(
          description.getSchema("add-component.component")
        ),
        position: z.number().int().min(0).optional(),
      }),
    },

    "add-component-html": {
      schema: z.object({
        page: z.string(),
        parentId: z.string(),
        html: z.string(),
        position: z.number().int().min(0).optional(),
      }),
    },

    "delete-component": {
      schema: z.object({
        id: z.string(),
      }),
    },

    "move-component": {
      schema: z.object({
        id: z.string(),
        newParentId: z.string(),
        position: z.number().int().min(0).optional(),
      }),
    },

    "get-available-blocks": {
      schema: z.object({}),
    },

    "get-traits": {
      schema: z.object({
        componentId: z.string().optional(),
      }),
    },

    "get-layers": {
      schema: z.object({
        page: z.string().optional(),
      }),
    },
  };

  return Object.entries(clientTools).map(([name, info]) => {
    const desc = description.getTool(name as ToolKeys);

    if (model.startsWith("google-genai:") && info.geminiSchema) {
      return {
        name: name as keyof AiPilotChatEvents["serverRequests"],
        description: desc,
        schema: info.geminiSchema,
      };
    }

    return {
      name: name as keyof AiPilotChatEvents["serverRequests"],
      description: desc,
      schema: info.schema,
    };
  });
}
