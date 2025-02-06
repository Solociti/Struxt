import createStudioEditor from "@grapesjs/studio-sdk";
import { createChild } from "./createChild";
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
    id: projectId,
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
