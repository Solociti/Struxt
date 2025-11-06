import { AiPilotChatEvents } from "./aiPilotEvents";

interface Description {
  displayName: string;
}

export type ToolKeys =
  | keyof AiPilotChatEvents["serverRequests"]
  // add server side only tools here
  | "list-project-memories"
  | "get-project-memory"
  | "save-project-memory"
  | "archive-project-memory"
  | "search-project-memories"
  | "get-memories-by-type";

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
  "get-project-memory": {
    displayName: "Get Memory",
  },
  "list-project-memories": {
    displayName: "List Memories",
  },
  "save-project-memory": {
    displayName: "Update Memory",
  },
  "archive-project-memory": {
    displayName: "Archive Memory",
  },
  "search-project-memories": {
    displayName: "Search Memory",
  },
  "get-memories-by-type": {
    displayName: "Get Memories by Type",
  },
};
