import { Editor } from "grapesjs";
import divIcon from "./icons/div.svg?raw";

export function registerElements(editor: Editor) {
  const defaults = editor.DomComponents.getType("default").model.getDefaults();
  const defaultTraits = defaults.traits;

  const linkDefaults =
    editor.DomComponents.getType("link")?.model.getDefaults();
  const linkTraits = linkDefaults ? linkDefaults.traits : [];

  const elements = [
    { el: "a", traits: ["id", ...linkTraits], config: {} },
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
        console.log(el);
        if (typeof el !== "object") {
          return;
        }

        const isGrapesJsComponent =
          el.classList && [...el.classList].join(" ").includes("gjs-");

        if (!isGrapesJsComponent && el.tagName === element.toUpperCase()) {
          return { type: element };
        }
      },
      model: {
        defaults: {
          tagName: element,
          droppable: true,
          traits: traits,
          ...config,
        },
      },
      view: {},
    });
  }
}
