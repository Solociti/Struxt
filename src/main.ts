import createStudioEditor from "@grapesjs/studio-sdk";
import customCodePlugin from "grapesjs-custom-code";
import parserPostCSS from "grapesjs-parser-postcss";
import { registerElements } from "./components/htmlElements";
import { createChild } from "./createChild";
import { addFonts } from "./fonts/addFonts";
import { publishSite } from "./publish/publishSite";

import "./external-sites/site.scss";
import "./style.css";
// @ts-ignore
import "@grapesjs/studio-sdk/style";

let projectId = location.hash.slice(1) || "default";

document.getElementById("app");
createChild(document.getElementById("app"), "div", {
  id: "studio-editor",
  style: "height: 100vh;",
});

createStudioEditor({
  root: "#studio-editor",
  licenseKey:
    "39b0a964ef184394a659bb8015cc8822efcbe5c371a44a9f86883d45806f1065",
  project: {
    type: "web",
    default: {
      pages: [
        { name: "Home", component: "<h1>Home page</h1>" },
        { name: "About", component: "<h1>About page</h1>" },
        { name: "Contact", component: "<h1>Contact page</h1>" },
      ],
    },
    id: projectId,
  },
  plugins: [
    parserPostCSS,
    customCodePlugin,
    (editor) => {
      editor.onReady(() => {
        // let's show the global style panel on start
        // editor.runCommand("studio:layoutToggle", {
        //   id: "gs",
        //   layout: "panelGlobalStyles",
        //   header: { label: "Global Styles" },
        //   placer: { type: "absolute", position: "right" },
        // });
      });
    },
    // bootstrapPlugin,
    (editor) => {
      registerElements(editor);

      addFonts(editor);

      console.log(editor);
    },
  ],
  layout: {
    default: {
      type: "row",
      style: { height: "100%" },
      children: [
        { type: "sidebarLeft" },
        {
          type: "canvasSidebarTop",
          sidebarTop: {
            leftContainer: {
              buttons: ({ items }) => [
                ...items,
                {
                  id: "",
                  type: "button",
                  icon: '<svg viewBox="0 0 24 24"><path d="m13.13 22.19-1.63-3.83a21.05 21.05 0 0 0 4.4-2.27l-2.77 6.1M5.64 12.5l-3.83-1.63 6.1-2.77a21.05 21.05 0 0 0-2.27 4.4M21.61 2.39S16.66.27 11 5.93a19.82 19.82 0 0 0-4.35 6.71c-.28.75-.09 1.57.46 2.13l2.13 2.12c.55.56 1.37.74 2.12.46A19.1 19.1 0 0 0 18.07 13c5.66-5.66 3.54-10.61 3.54-10.61m-7.07 7.07a2 2 0 0 1 2.83-2.83 2 2 0 0 1-2.83 2.83m-5.66 7.07-1.41-1.41 1.41 1.41M6.24 22l3.64-3.64a3.06 3.06 0 0 1-.97-.45L4.83 22h1.41M2 22h1.41l4.77-4.76-1.42-1.41L2 20.59V22m0-2.83 4.09-4.08c-.21-.3-.36-.62-.45-.97L2 17.76v1.41Z"/></svg>',
                  tooltip: "Publish website ",
                  onClick: ({ editor, event }) => {
                    const layoutId = "publishWebsiteProd";
                    const rect = event.currentTarget.getBoundingClientRect();

                    editor.runCommand("studio:layoutToggle", {
                      id: layoutId,
                      header: false,
                      placer: {
                        type: "popover",
                        closeOnClickAway: true,
                        x: rect.x,
                        y: rect.y,
                        w: rect.width,
                        h: rect.height,
                        options: { placement: "bottom-start" },
                      },
                      style: { width: 200 },
                      layout: {
                        type: "column",
                        style: { padding: 10, gap: 10 },
                        children: [
                          {
                            type: "button",
                            variant: "primary",
                            label: "Publish Staging",
                            full: true,
                            onClick: async (event: any) => {
                              await publishSite(
                                event.editor,
                                projectId,
                                "staging"
                              );

                              editor.runCommand("studio:layoutRemove", {
                                id: layoutId,
                              });
                            },
                          },
                          {
                            type: "button",
                            variant: "primary",
                            label: "Publish Production",
                            full: true,
                            onClick: async (event: any) => {
                              await publishSite(
                                event.editor,
                                projectId,
                                "production"
                              );

                              editor.runCommand("studio:layoutRemove", {
                                id: layoutId,
                              });
                            },
                          },
                        ],
                      },
                    });
                  },
                },
              ],
            },
          },
        },
        { type: "sidebarRight" },
      ],
    },
  },
  assets: {
    storageType: "self",
    // Provide a custom upload handler for assets
    onUpload: async ({ files }) => {
      const body = new FormData();
      for (const file of files) {
        body.append("files", file);
      }
      const response = await fetch("/api/assets/upload/" + projectId, {
        method: "POST",
        body,
      });
      const result = await response.json();
      // The expected result should be an array of assets, eg.
      // [{ src: 'ASSET_URL' }]
      return result;
    },
    // Provide a custom handler for deleting assets
    onDelete: async ({ assets }) => {
      const body = JSON.stringify(assets);
      await fetch("/api/assets/" + projectId, { method: "DELETE", body });
    },
  },
  storage: {
    type: "self",
    // Provide a custom handler for saving the project data.
    onSave: async ({ project }) => {
      await fetch("/api/projects/" + projectId, {
        method: "POST",
        body: JSON.stringify({ project, id: projectId }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    // Provide a custom handler for loading project data.
    onLoad: async () => {
      const response = await fetch("/api/projects/" + projectId);
      const result = await response.json();
      // The project JSON is expected to be returned inside an object.
      return { project: result.project };
    },
    autosaveChanges: 5,
    autosaveIntervalMs: 10000,
  },
});
