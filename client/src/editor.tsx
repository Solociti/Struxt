import { SetupErrorSnackBar } from "client/components/ErrorSnackBar";
import ToastTopProvider from "client/components/ToastTop";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import { EditorApp } from "./editor/EditorApp";

import "./style.css";

// mount the application
const root = createRoot(document.getElementById("app") as any);
root.render(
  <StrictMode>
    <ErrorBoundary>
      {/* Add the error snack bar */}
      <SetupErrorSnackBar />
      <ToastTopProvider />

      <EditorApp />
    </ErrorBoundary>
  </StrictMode>
);
