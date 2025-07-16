import { ComponentDefinition, Editor, TraitProperties } from "grapesjs";
import { getDefaultTraits, setupTraitTypes } from "../traits/traits";
import divIcon from "./icons/div.svg?raw";
import { updateImage } from "./imageEl";
import { setupLinkElement } from "./linkEl";

export function registerElements(editor: Editor) {
  setupTraitTypes(editor);

  const defaultTraits = getDefaultTraits(editor);

  updateImage(editor, defaultTraits);
  setupLinkElement(editor, defaultTraits);

  setupHTMlElements(editor);
}

/**
 * Setup the basic HTML elements
 *
 * @param editor
 */
function setupHTMlElements(
  editor: Editor,
  defaultTraits: TraitProperties[] = []
) {
  const elements: {
    el: string;
    traits: TraitProperties[];
    config: Omit<ComponentDefinition, "traits">;
  }[] = [
    { el: "article", traits: [...defaultTraits], config: {} },
    { el: "code", traits: [...defaultTraits], config: {} },
    { el: "div", traits: [...defaultTraits], config: {} },
    { el: "footer", traits: [...defaultTraits], config: {} },
    { el: "header", traits: [...defaultTraits], config: {} },
    { el: "hr", traits: [...defaultTraits], config: {} },
    { el: "i", traits: [...defaultTraits], config: {} },
    { el: "li", traits: [...defaultTraits], config: {} },
    { el: "main", traits: [...defaultTraits], config: {} },
    { el: "nav", traits: [...defaultTraits], config: {} },
    { el: "ol", traits: [...defaultTraits], config: {} },
    { el: "p", traits: [...defaultTraits], config: {} },
    { el: "pre", traits: [...defaultTraits], config: {} },
    { el: "small", traits: [...defaultTraits], config: {} },
    { el: "span", traits: [...defaultTraits], config: {} },
    { el: "template", traits: [...defaultTraits], config: {} },
    { el: "ul", traits: [...defaultTraits], config: {} },
  ];

  for (const { el: element, config, traits } of elements) {
    editor.BlockManager.add(element, {
      label: element,
      media: divIcon,
      category: "HTML Elements",
      content: {
        type: element,
        style: {
          padding: "0.5rem",
        },
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
          editable: true,
          droppable: true,
          traits: traits,
          ...config,
        },
      },
      view: {},
    });
  }
}
