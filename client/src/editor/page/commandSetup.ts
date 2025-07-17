import { Editor } from "grapesjs";

/**
 * Setup the page commands for the editor
 *
 * @param editor
 */
export function pageCommandSetup(editor: Editor) {
  const { Commands } = editor;

  Commands.add("struxt:page:settings", {
    run: (_editor, _sender, options) => {
      const page = options.page;
      if (!page) {
        return;
      }
    },
    stop: (_editor, _sender, _options) => {},
  });
}
