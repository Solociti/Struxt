import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { getPageContext } from "./context";

/**
 * Setup the client tools that the AI agents can request
 *
 * @param editor
 * @returns
 */
export function setupClientTools(
  editor: GrapesEditor
): AiPilotChatEvents["serverRequests"] {
  return {
    "list-pages": async () => {
      console.log("Listing pages for AI Pilot");

      return {
        success: true,
        pages: editor.Pages.getAll().map((p) => getPageContext(p)),
      };
    },
    "get-page-html": async (request) => {
      const page = editor.Pages.get(request.page);

      return {
        success: true,
        page: getPageContext(page),
        html: page?.getMainComponent().toHTML() || "<Not Found />",
      };
    },
    "list-styles-selectors": async () => {
      // get all selectors in the editor
      const selectors = editor.Css.getRules().map((cls) =>
        cls.selectorsToString()
      );

      return {
        success: true,
        selectors,
      };
    },
    "get-style-by-selector": async (request) => {
      // find the class in the editor
      const rules = editor.Css.getRules(request.selector);

      return {
        success: true,
        styles: rules.map((r) => r.toCSS()),
      };
    },
  };
}
