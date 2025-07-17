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

  // get the default image traits
  const imageTraits = imageType.model.prototype.defaults.traits || [];

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
          ...defaultTraits.filter(
            (t) => !t.name || t.name !== "customAttributes"
          ),
          ...imageTraits,
        ],
      },
    },
  });
  editor.DomComponents.addType("imageBox", {
    extend: "imageBox",
    model: {
      defaults: {
        tagName: "img",
        droppable: true,
        traits: [
          ...defaultTraits.filter(
            (t) => !t.name || t.name !== "customAttributes"
          ),
          ...imageTraits,
        ],
      },
    },
  });

  editor.BlockManager.remove("image");
  editor.BlockManager.add("image", {
    label: "Image",
    media: imgIcon,
    category: "Basic",
    content: {
      type: "image",
      src: "https://placehold.co/200x100",
      attributes: {
        loading: "lazy",
      },
      style: {
        maxWidth: "100%",
      },
    },
  });

  const block = editor.BlockManager.get("imageBox");

  editor.BlockManager.remove("imageBox");
  editor.BlockManager.add("imageBox", {
    label: "Image Box",
    media: block.attributes.media,
    category: "Basic",
    content: {
      type: "imageBox",
      src: "https://placehold.co/200x100",
      attributes: {
        loading: "lazy",
      },
    },
  });
}
