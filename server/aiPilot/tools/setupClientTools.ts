import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import z from "zod";

/**
 * List of registered tools for the ai agents.
 */
const clientTools: {
  name: keyof AiPilotChatEvents["serverRequests"];
  description: string;
  schema: z.ZodSchema;
}[] = [
  {
    name: "list-pages",
    description: "Get the list of pages in the current project.",
    schema: z.object({}),
  },
  {
    name: "get-page-html",
    description: "Get the full HTML content of a given page.",
    schema: z.object({
      page: z.string().describe("The page ID to get the HTML for"),
    }),
  },
  {
    name: "list-styles-selectors",
    description: "Get the list of all CSS selectors in the current project.",
    schema: z.object({}),
  },
  {
    name: "get-style-by-selector",
    description: "Get the CSS styles associated with a given CSS selector.",
    schema: z.object({
      selector: z.string().describe("The CSS selector to get the styles for"),
    }),
  },
];

/**
 * Get the list of tools that the AI agents can request from the client
 *
 * @returns
 */
export async function getClientTools() {
  // ! this function is async to allow for future description fetching if needed
  return clientTools;
}
