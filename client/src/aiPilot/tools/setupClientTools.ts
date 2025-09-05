import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import * as cheerio from "cheerio";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { BasicComponentTree } from "common/api/aiPilot/eventHelpers";
import { Component, ContentType } from "grapesjs";
import { getPageContext } from "./context";

// @ts-ignore
window.cheerio = cheerio;

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
      console.log("Listing pages for AI Pilot");

      return {
        success: true,
        pages: editor.Pages.getAll().map((p) => getPageContext(p)),
      };
    },
    "get-page-html": async (request) => {
      const page = editor.Pages.get(request.page);

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

      // TODO: handle if no component is found. Need to alert the llm to select a component first
      return {
        success: true,
        traits: component
          ? component.getTraits().map((trait) => ({
              name: trait.getName(),
              type: trait.getType(),
              value: trait.getValue(),
              options: trait.getOptions(),
            }))
          : [],
      };
    },

    "get-layers": async (request) => {
      const page = request.page
        ? editor.Pages.get(request.page)
        : editor.Pages.getSelected();

      // TODO: notify the llm if no page is found
      if (!page) {
        return { success: false, layers: [] };
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
  };
}
