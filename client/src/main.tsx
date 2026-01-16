import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./bootstrap/Theme";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardApp from "./dashboard/Dashboard";
import "./sw/registerSW";

import "./style.css";

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
