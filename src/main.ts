import createStudioEditor from "@grapesjs/studio-sdk";
import customCodePlugin from "grapesjs-custom-code";
import parserPostCSS from "grapesjs-parser-postcss";
import { createChild } from "./createChild";
// import bootstrapPlugin, {
//   canvasScripts,
//   canvasStyles,
// } from "@treimer/grapesjs-blocks-bootstrap-5";

import "./style.css";
import "./external-sites/site.scss";
// @ts-ignore
import "@grapesjs/studio-sdk/style";
import { registerDiv } from "./components/div";

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
      registerDiv(editor);

      console.log(editor);
    },
  ],
  // globalStyles: {
  //   default: [
  //     {
  //       id: "h1Color",
  //       property: "color",
  //       field: "color",
  //       defaultValue: "red",
  //       selector: "h1",
  //       label: "H1 color",
  //     },
  //     {
  //       id: "h1Size",
  //       property: "font-size",
  //       field: { type: "number", min: 0.1, max: 10, step: 0.1, units: ["rem"] },
  //       defaultValue: "2rem",
  //       selector: "h1",
  //       label: "H1 size",
  //     },
  //   ],
  // },
  // onEditor: (editor) => {
  //   const config = editor.getConfig();
  //   config.canvas?.styles?.push(...canvasStyles);
  //   config.canvas?.scripts?.push(...canvasScripts);
  // },
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
