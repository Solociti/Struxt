import {
  Component,
  ComponentDefinition,
  Editor,
  TraitProperties,
} from "grapesjs";
import { customAttributesTrait, getDefaultTraits } from "./traits";

const imageComponent: ComponentDefinition = {
  tagName: "img",
  type: "pswp-img",
  draggable: ".pswp-img-anchor, .pswp-img-anchor *",
  attributes: {
    src: "https://cdn.photoswipe.com/photoswipe-demo-images/photos/1/img-200.jpg",
    alt: "",
  },
};

const anchorComponent: ComponentDefinition = {
  tagName: "a",
  type: "pswp-img-anchor",
  classes: ["pswp-img-anchor"],
  draggable: ".pswp-viewer, .pswp-viewer *",
  attributes: {
    href: "https://cdn.photoswipe.com/photoswipe-demo-images/photos/1/img-2500.jpg",
    "data-pswp-width": "1875",
    "data-pswp-height": "2500",
    target: "_blank",
  },
  style: {
    display: "inline-block",
  },
  components: [imageComponent],
};

const viewerComponent: ComponentDefinition = {
  type: "pswp-viewer",
  tagName: "div",
  droppable: true,
  classes: ["pswp-viewer"],
  components: [anchorComponent],
};

/**
 * The script to initialize the viewer
 *
 * @param this
 * @returns
 */
function viewerScript(this: HTMLElement) {
  if (
    // prevent injecting in editor
    this.getAttribute("data-gjs-type") ||
    // prevent multiple injections
    document.querySelector("script[data-pswp-injected]")
  ) {
    return;
  }

  const script = document.createElement("script");
  script.setAttribute("type", "module");
  script.setAttribute("data-pswp-injected", "true");
  script.innerHTML = `
import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe/dist/photoswipe-lightbox.esm.js';
const lightbox = new PhotoSwipeLightbox({
gallery: '.pswp-viewer',
children: '.pswp-img-anchor',
pswpModule: () => import('https://unpkg.com/photoswipe'),
});
lightbox.init();
`;

  const style = document.createElement("link");
  style.setAttribute("rel", "stylesheet");
  style.setAttribute(
    "href",
    "https://unpkg.com/photoswipe/dist/photoswipe.css"
  );
  document.head.appendChild(script);
  document.head.appendChild(style);
}

/**
 * Setup the image viewer components
 *
 * @param editor
 */
export function registerImageViewer(editor: Editor) {
  const defaultTraits = getDefaultTraits(editor);

  editor.DomComponents.addType("pswp-viewer", {
    isComponent: (el: HTMLElement) => {
      if (el.tagName === "DIV" && el.classList.contains("pswp-viewer")) {
        return { type: "pswp-viewer" };
      }
    },
    model: {
      defaults: {
        ...viewerComponent,
        traits: [...defaultTraits],
        script: viewerScript,
      },
    },
    block: {
      label: "PSWP Viewer",
      // media: "<svg>...</svg>", TODO: Add icon
      category: "Extra",
      attributes: {
        class: "pswp-viewer",
      },
      content: viewerComponent,
    },
  });

  const imageType = editor.DomComponents.getType("image");
  const imageDefaults = imageType ? imageType.model.getDefaults() : null;
  const imageTraits = imageDefaults
    ? imageDefaults.traits.filter((t: TraitProperties) => t.label !== "Image")
    : [];

  editor.DomComponents.addType("pswp-img-anchor", {
    isComponent: (el: HTMLElement) => {
      if (el.tagName === "A" && el.classList.contains("pswp-img-anchor")) {
        console.log("pswp-img-anchor");
        return { type: "pswp-img-anchor" };
      }
    },
    model: {
      defaults: {
        ...anchorComponent,
        traits: [
          {
            label: "HQ Image",
            name: "href",
            type: "image",
            typeProps: { inputField: true },
          },
          {
            label: "HQ Width",
            name: "data-pswp-width",
            type: "number",
          },
          {
            label: "HQ Height",
            name: "data-pswp-height",
            type: "number",
          },
          {
            label: "Image",
            name: "img-src",
            type: "image",
            typeProps: { inputField: true },
          },
          ...imageTraits,
        ],
      },
      init() {
        this.on("change:attributes", this.handleAttrChange);
        this.on("change:attributes:href", this.handleHrefChange);
      },

      handleHrefChange() {
        const attributes = this.getAttributes();
        // get the image dimensions
        const href = attributes.href || "";
        if (!href) {
          return;
        }

        const img = new Image();
        img.src = href;
        img.onload = () => {
          const { width, height } = img;
          this.setAttributes({
            ...attributes,
            "data-pswp-width": width,
            "data-pswp-height": height,
          });
        };
        img.onerror = () => {
          console.error("Failed to load image dimensions.", href);
        };
      },

      handleAttrChange() {
        const attributes = this.getAttributes();

        const alt = attributes.alt || "";
        const src = attributes["img-src"] || "";

        // load the image component that is inside the anchor
        const img = this.components().find(
          (c: Component) => c.get("type") === "pswp-img"
        );

        if (img) {
          const imgAttr = img.getAttributes();
          img.setAttributes({ ...imgAttr, alt, src });
        }
      },
    },
    view: {},
    block: {
      label: "PSWP Image",
      // media: "<svg>...</svg>", TODO: Add icon
      category: "Extra",
      attributes: { class: "pswp-img-anchor" },
      content: anchorComponent,
    },
  });

  const imgTraits: (string | Partial<TraitProperties>)[] = ["id"];
  const customTrait = customAttributesTrait(editor);
  if (customTrait) {
    imgTraits.push(customTrait);
  }

  editor.DomComponents.addType("pswp-img", {
    isComponent: (el: HTMLElement) => {
      if (el.tagName === "IMG" && el.classList.contains("pswp-img")) {
        return { type: "pswp-img" };
      }
    },
    model: {
      defaults: {
        ...imageComponent,
        droppable: false,
        traits: imgTraits,
      },
    },
    view: {},
  });
}
