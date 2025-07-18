import { Editor, TraitProperties } from "grapesjs";
import { isGrapesJsComponent } from "./helpers";
import oListIcon from "./icons/OrderedList.svg?raw";
import listItemIcon from "./icons/listItem.svg?raw";
import uListIcon from "./icons/unOrderedList.svg?raw";

/**
 * Setup the list components for the editor.
 *
 * @param editor
 * @param defaultTraits
 */
export function registerListElements(
  editor: Editor,
  defaultTraits: TraitProperties[]
) {
  const primaryTraits = defaultTraits.filter(
    (t) => !t.name || t.name !== "customAttributes"
  );
  const customTraits = defaultTraits.filter(
    (t) => t.name === "customAttributes"
  );

  const listItemContent = {
    type: "li",
    components: [
      {
        type: "textnode",
        content: "List Item",
      },
    ],
  };

  // add the list item
  editor.BlockManager.add("li", {
    label: "List Item",
    media: listItemIcon,
    category: "Lists",
    content: listItemContent,
  });

  editor.DomComponents.addType("li", {
    isComponent: (el: HTMLElement) => {
      if (typeof el !== "object" || isGrapesJsComponent(el)) {
        return;
      }

      if (el.tagName === "LI") {
        return { type: "li" };
      }
    },
    extend: "text",
    model: {
      defaults: {
        tagName: "li",
        droppable: "ol, ul",
        editable: true,
        traits: [...defaultTraits],
      },
    },
  });

  // add the un ordered list
  editor.BlockManager.add("ul", {
    label: "Unordered List",
    media: uListIcon,
    category: "Lists",
    content: {
      type: "ul",
      style: {
        margin: "0.5rem",
      },
      components: [listItemContent, listItemContent, listItemContent],
    },
  });

  editor.DomComponents.addType("ul", {
    isComponent: (el: HTMLElement) => {
      if (typeof el !== "object" || isGrapesJsComponent(el)) {
        return;
      }

      if (el.tagName === "UL") {
        return { type: "ul" };
      }
    },
    model: {
      defaults: {
        tagName: "ul",
        droppable: true,
        editable: true,
        traits: [
          ...primaryTraits,
          {
            type: "select",
            name: "type",
            label: "List Type",
            options: [
              { id: "disc", name: "Disc" },
              { id: "circle", name: "Circle" },
              { id: "square", name: "Square" },
            ],
          },
          ...customTraits,
        ],
      },
    },
  });

  // add the ordered list
  editor.BlockManager.add("ol", {
    label: "Ordered List",
    media: oListIcon,
    category: "Lists",
    content: {
      type: "ol",
      style: {
        margin: "0.5rem",
      },
      components: [listItemContent, listItemContent, listItemContent],
    },
  });

  editor.DomComponents.addType("ol", {
    isComponent: (el: HTMLElement) => {
      if (typeof el !== "object" || isGrapesJsComponent(el)) {
        return;
      }

      if (el.tagName === "OL") {
        return { type: "ol" };
      }
    },
    model: {
      defaults: {
        tagName: "ol",
        droppable: true,
        editable: true,
        traits: [
          ...primaryTraits,
          {
            type: "select",
            name: "type",
            label: "List Type",
            options: [
              { id: "1", name: "Integer" },
              { id: "a", name: "Lower Alpha" },
              { id: "A", name: "Upper Alpha" },
              { id: "i", name: "Lower Roman" },
              { id: "I", name: "Upper Roman" },
            ],
          },
          ...customTraits,
        ],
      },
    },
  });
}
