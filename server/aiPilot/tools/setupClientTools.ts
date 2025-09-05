import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import z from "zod";

interface ClientTool {
  name: keyof AiPilotChatEvents["serverRequests"];
  description: string;
  schema: z.ZodSchema;
}

const clientTools: {
  [K in keyof AiPilotChatEvents["serverRequests"]]: Omit<ClientTool, "name">;
} = {
  "list-pages": {
    description: "Get the list of pages in the current project.",
    schema: z.object({}),
  },
  "get-page-html": {
    description: "Get the full HTML content of a given page.",
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
  "get-elements": {
    description:
      "Get the HTML elements that match a given CSS selector on a page.",
    schema: z.object({
      page: z
        .string()
        .describe(
          "The page ID to get the elements from. Defaults to the selected page."
        ),
      selector: z
        .string()
        .optional()
        .describe(
          "The CSS selector to get the elements for. If not provided, all elements will be returned."
        ),
    }),
  },

  "get-available-blocks": {
    description: "Get the list of available blocks in the editor.",
    schema: z.object({}),
  },

  "get-traits": {
    description:
      "Get the traits (properties) of a given component by its ID. If no ID is provided, selected component is used.",
    schema: z.object({
      componentId: z.string().optional(),
    }),
  },

  "get-layers": {
    description:
      "Get the layer structure of a given page. If no page ID is provided, uses selected page.",
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
