import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EditorApp } from "./editor/EditorApp";

import "./style.css";

// mount the application
const root = createRoot(document.getElementById("app") as any);
root.render(
  <StrictMode>
    <EditorApp />
  </StrictMode>
);
