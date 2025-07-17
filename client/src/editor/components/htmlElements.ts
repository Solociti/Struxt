import { Editor, TraitProperties } from "grapesjs";
import divIcon from "./icons/div.svg?raw";
import { updateImage } from "./imageEl";
import { getDefaultTraits } from "./traits";

/**
 * Register any custom components in the editor.
 *
 * @param editor
 */
export function registerComponents(editor: Editor) {
  const defaultTraits = getDefaultTraits(editor);

  registerHtmlElements(editor, defaultTraits);

  updateImage(editor, defaultTraits);
}

/**
 * Register the custom html elements in the editor.
 *
 * @param editor
 * @param defaultTraits
 */
function registerHtmlElements(
  editor: Editor,
  defaultTraits: TraitProperties[]
) {
  const elements = [
    {
      el: "article",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Content" },
    },
    {
      el: "code",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Content" },
    },
    {
      el: "div",
      traits: [...defaultTraits],
      config: {},
      content: {},
    },
    {
      el: "footer",
      traits: [...defaultTraits],
      config: {},
      content: {},
    },
    {
      el: "header",
      traits: [...defaultTraits],
      config: {},
      content: {},
    },
    {
      el: "i",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Content" },
    },
    {
      el: "li",
      traits: [...defaultTraits],
      config: {},
      content: { content: "List Item" },
    },
    {
      el: "main",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Content" },
    },
    {
      el: "nav",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Nav" },
    },
    {
      el: "ol",
      traits: [...defaultTraits],
      config: {},
      content: { content: "" },
    },
    {
      el: "p",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Content" },
    },
    {
      el: "pre",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Content" },
    },
    {
      el: "small",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Content" },
    },
    {
      el: "span",
      traits: [...defaultTraits],
      config: {},
      content: { content: "Content" },
    },
    {
      el: "template",
      traits: [...defaultTraits],
      config: {},
      content: {},
    },
    {
      el: "ul",
      traits: [...defaultTraits],
      config: {},
      content: { content: "List" },
    },
  ];

  for (const { el: element, config, traits, content } of elements) {
    editor.BlockManager.add(element, {
      label: element,
      media: divIcon,
      category: "HTML Elements",
      content: {
        type: element,
        style: {
          padding: "0.5rem",
        },
        ...content,
      },
    });

    editor.DomComponents.addType(element, {
      isComponent: (el: HTMLElement) => {
        if (typeof el !== "object") {
          return;
        }

        const classString = (el.getAttribute && el.getAttribute("class")) || "";
        const isGrapesJsComponent = classString.includes("gjs-");
        if (isGrapesJsComponent) {
          return;
        }

        const isCustomComponent = classString.includes("pswp-");
        if (isCustomComponent) {
          return;
        }

        if (el.tagName === element.toUpperCase()) {
          return { type: element };
        }
      },
      model: {
        defaults: {
          tagName: element,
          droppable: true,
          editable: true,
          traits: traits,
          ...config,
        },
      },
    });
  }
}
