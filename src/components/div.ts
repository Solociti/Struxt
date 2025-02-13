import { Editor } from "grapesjs";
import divIcon from "./icons/div.svg?raw";

export function registerDiv(editor: Editor) {
  editor.BlockManager.add("div", {
    label: "Div",
    media: divIcon,
    category: "Basic",
    content: {
      type: "div",
      style: {
        width: "100%",
        padding: "0.5rem",
      },
    },
  });

  editor.DomComponents.addType("div", {
    isComponent: (el: HTMLElement) => {
      if (el.tagName === "DIV") {
        return { type: "div" };
      }
    },
    model: {
      defaults: {
        tagName: "div",
        droppable: true,
        traits: [],
      },
    },
    view: {},
  });
}
