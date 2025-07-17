import { Editor } from "grapesjs";

/**
 * Setup the page commands for the editor
 *
 * @param editor
 */
export function setupPageCommands(editor: Editor) {
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

/**
 * Setup the custom components for page settings
 *
 * @param editor
 */
export function setupPageComponents(editor: Editor) {
  editor.Components.addType("custom-html-body", {
    isComponent: (el) => {
      return Boolean(el.hasAttribute("data-custom-html-body"));
    },
    model: {
      defaults: {
        attributes: {
          "data-custom-html-body": true,
        },
        locked: true,
        layerable: false,
      },
    },
  });
}
