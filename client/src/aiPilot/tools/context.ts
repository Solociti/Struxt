import {
  Editor,
  Editor as GrapesEditor,
} from "@grapesjs/studio-sdk-plugins/dist/types.js";
import { AiMessageContext } from "common/models/aiPilot/tools/Context";

/**
 * Get the editor context to send with the chat message
 *
 * @param editor
 */
export function getEditorContext(editor: GrapesEditor): AiMessageContext {
  // get the current selection
  const selected = editor.getSelectedAll();

  const page = editor.Pages.getSelected();

  return {
    selected: selected.map((s) => ({
      id: s.getId() || "",
      type: s.getType() || "",
      html:
        s.toHTML({
          withProps: true,
        }) || "",
      parentId: s.parent()?.getId(),
    })),
    page: getPageContext(page),
    currentDevice: editor.getDevice() as AiMessageContext["currentDevice"],
  };
}

/**
 * Get the given page context
 *
 * @param page
 * @returns
 */
export function getPageContext(
  page: ReturnType<Editor["Pages"]["getAll"]>[0] | undefined
) {
  const pageSettings = page?.get("settings") as
    | Record<string, string | number>
    | undefined;

  const pageName = page?.getName() || "";
  const slug =
    (pageSettings?.slug as string) ||
    pageName.replace(/\s+/g, "-").toLowerCase() ||
    "";

  return {
    id: page?.getId() || "",
    name: pageName || "",
    slug,
  };
}
