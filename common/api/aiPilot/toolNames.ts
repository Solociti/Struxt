import { AiPilotChatEvents } from "./aiPilotEvents";

interface Description {
  displayName: string;
}

type ToolKeys =
  | keyof AiPilotChatEvents["serverRequests"]
  | "update-context"
  | "list-context-keys"
  | "get-context";

// TODO: add the context tools / server side only tools
export const toolNames: {
  [K in ToolKeys]: Omit<Description, "name">;
} = {
  "add-component": {
    displayName: "Add Component",
  },
  "add-component-html": {
    displayName: "Add HTML Component",
  },
  "get-available-blocks": {
    displayName: "Find Available Blocks",
  },
  "get-component": {
    displayName: "Lookup Component",
  },
  "get-elements": {
    displayName: "Find Elements",
  },
  "get-page-html": {
    displayName: "View Page",
  },
  "delete-component": {
    displayName: "Delete Component",
  },
  "move-component": {
    displayName: "Move Component",
  },
  "get-style-by-selector": {
    displayName: "Lookup Style",
  },
  "list-pages": {
    displayName: "Browse Pages",
  },
  "list-styles-selectors": {
    displayName: "Browse Style Selectors",
  },
  "update-style": {
    displayName: "Update Style",
  },
  "get-traits": {
    displayName: "View Traits",
  },
  "get-layers": {
    displayName: "View Layers",
  },
  "get-context": {
    displayName: "Get Context",
  },
  "list-context-keys": {
    displayName: "List Context Keys",
  },
  "update-context": {
    displayName: "Update Context",
  },
};
