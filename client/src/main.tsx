import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardApp from "./dashboard/Dashboard";
import { registerServiceWorker } from "./registerSW";
import { ThemeProvider } from "./bootstrap/Theme";

import "./style.css";

// Register Service Worker
registerServiceWorker();

// mount the application
const root = createRoot(document.getElementById("app") as any);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <DashboardApp />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
