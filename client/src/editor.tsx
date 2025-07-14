import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import { EditorApp } from "./editor/EditorApp";

import "./style.css";
import { ThemeProvider } from "./bootstrap/Theme";

// mount the application
const root = createRoot(document.getElementById("app") as any);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <EditorApp />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
