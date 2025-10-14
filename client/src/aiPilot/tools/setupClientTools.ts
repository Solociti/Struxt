import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import * as cheerio from "cheerio";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import {
  BasicComponentTree,
  ComponentData,
} from "common/api/aiPilot/eventHelpers";
import { Component, ContentType } from "grapesjs";
import { getPageContext } from "./context";

/**
 * Setup the client tools that the AI agents can request
 *
 * @param editor
 * @returns
 */
export function setupClientTools(
  editor: GrapesEditor
): AiPilotChatEvents["serverRequests"] {
  return {
    "list-pages": async () => {
      return {
        success: true,
        pages: editor.Pages.getAll().map((p) => getPageContext(p)),
      };
    },
    "get-page-html": async (request) => {
      const page = editor.Pages.get(request.pageId);

      return {
        success: true,
        page: getPageContext(page),
        html: page?.getMainComponent().toHTML() || "<Not Found />",
      };
    },
    "list-styles-selectors": async () => {
      // get all selectors in the editor
      const selectors = editor.Css.getRules().map((cls) =>
        cls.selectorsToString()
      );

      return {
        success: true,
        selectors,
      };
    },
    "get-style-by-selector": async (request) => {
      // find the class in the editor
      const rules = editor.Css.getRules(request.selector);

      return {
        success: true,
        styles: rules.map((r) => r.toCSS()),
      };
    },
    "update-style": async (request) => {
      // replace the rule
      if (request.method === "set") {
        const rule = editor.Css.addRules(request.css);

        return {
          success: true,
          style: rule.map((r) => r.toCSS()).join("\n"),
        };
      }

      // append to the existing styles
      if (request.method === "append") {
        // TODO: implement append method
        throw new Error("Append method not implemented yet");
      }

      return { success: false, style: "" };
    },

    "get-elements": async (request) => {
      // get the page by id or the selected page
      const page = (() => {
        if (request.page) {
          const p = editor.Pages.get(request.page);
          if (p) {
            return p;
          }
        }

        return editor.Pages.getSelected();
      })();

      if (!page) {
        return {
          success: false,
          elements: [],
        };
      }

      const query = request.selector || "*";
      const html = page.getMainComponent().toHTML({
        withProps: true,
      });

      const $ = cheerio.load(html);
      const elements = $(query);

      return {
        success: true,
        elements: elements.get().map((el) => $.html(el)),
      };
    },

    "get-available-blocks": async () => {
      const blocks = editor.Blocks.getAll();

      const convert = (
        comp: ContentType | (() => ContentType)
      ): BasicComponentTree => {
        if (typeof comp === "function") {
          comp = comp();
        }

        if (typeof comp === "string") {
          return comp;
        }

        if (Array.isArray(comp)) {
          return {
            type: "container",
            components: comp.map(convert),
          };
        }

        const components = (() => {
          if (Array.isArray(comp.components)) {
            return comp.components.map(convert);
          }
          if (comp.components) {
            return [convert(comp.components)];
          }
          return [];
        })();

        return {
          type: (comp as any).type || "unknown",
          components: components.length ? components : undefined,
        };
      };

      return {
        success: true,
        blocks: blocks.slice().map((block) => {
          const content = block.getContent();

          return {
            id: block.getId(),
            label: block.get("label"),
            content: content ? convert(content) : undefined,
          };
        }),
      };
    },

    "get-traits": async (request) => {
      const component = request.componentId
        ? editor.Components.getById(request.componentId)
        : editor.getSelected();

      if (!component) {
        throw new Error("Could not find the requested component.");
      }

      return {
        success: true,
        traits: component.getTraits().map((trait) => ({
          name: trait.getName(),
          type: trait.getType(),
          value: trait.getValue(),
          options: trait.getOptions(),
        })),
      };
    },

    "get-layers": async (request) => {
      const page = request.page
        ? editor.Pages.get(request.page)
        : editor.Pages.getSelected();

      // notify the llm if no page is found
      if (!page) {
        throw new Error("Could not find the requested page");
      }

      const buildLayerTree = (component: Component): any => {
        const lData = editor.Layers.getLayerData(component);

        const children = component.components().map(buildLayerTree);

        return {
          id: component.getId(),
          name: component.getName(),
          type: component.getType(),
          visible: lData.visible,
          locked: Boolean(component.locked),
          children: children.length ? children : undefined,
        };
      };

      return {
        success: true,
        layers: buildLayerTree(page.getMainComponent()),
      };
    },

    "get-component": async (request) => {
      const componentId = request.id || null;

      const component = componentId
        ? editor.Components.getById(componentId)
        : editor.getSelected();

      if (!component) {
        throw new Error("Could not find the requested component.");
      }

      return {
        success: true,
        component: JSON.parse(JSON.stringify(component)) as ComponentData,
      };
    },

    "add-component": async (request) => {
      const page = editor.Pages.get(request.page);
      if (!page) {
        throw new Error("Could not find the requested page");
      }

      const parent = editor.Components.getById(request.parentId);
      if (!parent) {
        throw new Error("Could not find the requested parent component");
      }

      const components = parent.append(request.component, {
        at: request.position,
      });

      return {
        success: Boolean(components.length),
        ids: components.map((c) => c.getId()),
      };
    },

    "add-component-html": async (request) => {
      const page = editor.Pages.get(request.page);
      if (!page) {
        throw new Error("Could not find the requested page");
      }

      const parent = editor.Components.getById(request.parentId);
      if (!parent) {
        throw new Error("Could not find the requested parent component");
      }

      const components = parent.append(request.html, { at: request.position });

      return {
        success: Boolean(components.length),
        ids: components.map((c) => c.getId()),
      };
    },

    "delete-component": async (request) => {
      const componentId = request.id || null;
      if (!componentId) {
        throw new Error("No component id provided");
      }

      const component = editor.Components.getById(componentId);
      if (!component) {
        throw new Error("Could not find the requested component");
      }

      component.remove({});
      return { success: true };
    },

    "move-component": async (request) => {
      const componentId = request.id || null;
      const parentId = request.newParentId || null;
      const index = request.position;

      if (!componentId || !parentId) {
        throw new Error("Component id or new parent id not provided");
      }

      const component = editor.Components.getById(componentId);
      const newParent = editor.Components.getById(parentId);

      if (!component) {
        throw new Error("Could not find the requested component");
      }
      if (!newParent) {
        throw new Error("Could not find the requested new parent component");
      }

      component.move(newParent, index !== undefined ? { at: index } : {});

      return { success: true };
    },
  };
}
