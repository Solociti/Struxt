import { Editor, TraitProperties } from "grapesjs";
import divIcon from "./icons/div.svg?raw";

export function setupLinkElement(
  editor: Editor,
  defaultTraits: TraitProperties[]
) {
  const linkType = editor.DomComponents.getType("link");
  if (!linkType) {
    return;
  }

  editor.DomComponents.addType("a", {
    extend: "link",
    isComponent: (el) => {
      return el.tagName === "A";
    },
    model: {
      defaults: {
        tagName: "a",
        droppable: true,
        editable: true,
        traits: [
          ...defaultTraits,
          {
            type: "href",
            name: "href",
            label: "URL",
          },
          {
            type: "select",
            name: "target",
            label: "Target",
            options: [
              { id: "_self", name: "Self" },
              { id: "_blank", name: "New window" },
              { id: "_parent", name: "Parent" },
              { id: "_top", name: "Top" },
            ],
          },
        ],
      },
    },
  });

  editor.BlockManager.add("a", {
    label: "Link",
    media: divIcon,
    category: "Basic",
    content: {
      type: "a",
      content: "Link Text",
      style: {
        padding: "0.5rem",
        color: "#00f",
      },
    },
  });
}
