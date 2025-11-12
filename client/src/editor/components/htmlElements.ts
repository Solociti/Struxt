import { Editor, TraitProperties } from "grapesjs";
import { isGrapesJsComponent } from "./helpers";
import divIcon from "./icons/div.svg?raw";
import { updateImage } from "./imageEl";
import { registerListElements } from "./listEl";
import { getDefaultTraits } from "./traits";

/**
 * Register any custom components in the editor.
 *
 * @param editor
 */
export function registerComponents(editor: Editor) {
  const defaultTraits = getDefaultTraits(editor);

  registerListElements(editor, defaultTraits);
  registerHtmlElements(editor, defaultTraits);
  registerLinkElement(editor);

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
      el: "code",
      traits: [...defaultTraits],
      category: "Text Elements",
      config: {},
      content: {
        components: [
          {
            type: "textnode",
            content: "# Hello World",
          },
        ],
      },
    },
    {
      el: "p",
      traits: [...defaultTraits],
      category: "Text Elements",
      config: {},
      content: {
        style: {},
      },
    },
    {
      el: "pre",
      traits: [...defaultTraits],
      category: "Text Elements",
      config: {},
      content: {
        style: {},
        components: [
          {
            type: "textnode",
            content: "##  ##  ##",
          },
        ],
      },
    },
    {
      el: "small",
      traits: [...defaultTraits],
      category: "Text Elements",
      config: {},
      content: {
        style: {},
      },
    },
    {
      el: "span",
      traits: [...defaultTraits],
      category: "Text Elements",
      config: {},
      content: {
        style: {},
      },
    },

    {
      el: "article",
      traits: [...defaultTraits],
      config: {},
      content: {},
    },
    {
      el: "section",
      traits: [...defaultTraits],
      config: {},
      content: {},
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
      el: "main",
      traits: [...defaultTraits],
      config: {},
      content: {},
    },
    {
      el: "nav",
      traits: [...defaultTraits],
      config: {
        type: "nav",
      },
      content: {},
    },
    {
      el: "template",
      traits: [...defaultTraits],
      config: {},
      content: {},
    },
  ];

  for (const { el: element, config, traits, content, category } of elements) {
    editor.BlockManager.add(element, {
      label: element,
      media: divIcon,
      category: category || "HTML Elements",
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

        if (isGrapesJsComponent(el)) {
          return;
        }

        const classString = (el.getAttribute && el.getAttribute("class")) || "";
        const isCustomComponent = classString.includes("pswp-");
        if (isCustomComponent) {
          return;
        }

        if (el.tagName === element.toUpperCase()) {
          return { type: element };
        }
      },
      extend: category === "Text Elements" ? "text" : undefined,
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

/**
 * Register the link element as a component.
 *
 * @param editor
 */
function registerLinkElement(editor: Editor) {
  // am not adding it to the block manager because there is a link block already.
  // This is just setup as a component for custom code inserting "a" elements.
  const linkDefaults =
    editor.DomComponents.getType("link")?.model.getDefaults();
  const linkTraits = linkDefaults ? linkDefaults.traits : [];

  editor.DomComponents.addType("a", {
    isComponent: (el: HTMLElement) => {
      if (typeof el !== "object" || isGrapesJsComponent(el)) {
        return;
      }

      if (el.tagName === "A") {
        return { type: "a" };
      }
    },
    model: {
      defaults: {
        tagName: "a",
        droppable: true,
        editable: true,
        traits: ["id", ...linkTraits],
      },
    },
  });
}
