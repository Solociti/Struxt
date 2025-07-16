import { Editor, TraitProperties } from "grapesjs";
import imgIcon from "./icons/img.svg?raw";

/**
 * Update the image component with extra traits
 *
 * @param editor
 * @returns
 */
export function updateImage(editor: Editor, defaultTraits: TraitProperties[]) {
  const imageType = editor.DomComponents.getType("image");
  if (!imageType) {
    return;
  }

  editor.DomComponents.addType("image", {
    extend: "image",
    isComponent: (el) => {
      return el.tagName === "IMG";
    },
    model: {
      defaults: {
        tagName: "img",
        droppable: true,
        traits: [
          ...defaultTraits,
          {
            type: "text",
            name: "alt",
            label: "Alt Text",
          },
          {
            type: "asset-src",
            name: "src",
            label: "Source",
          },
          {
            type: "checkbox",
            name: "loading",
            label: "Lazy Load",
            valueTrue: "lazy",
            valueFalse: "",
            default: "lazy",
          },
        ],
      },
    },
  });

  editor.BlockManager.add("image", {
    label: "Image",
    media: imgIcon,
    category: "Basic",
    content: {
      type: "image",
      src: "https://placehold.co/600x400",
      loading: "lazy",
      style: {},
    },
  });
}
