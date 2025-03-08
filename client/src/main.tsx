import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

// mount the application
const root = createRoot(document.getElementById("app") as any);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

function App() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* show the list of projects */}

      {/* open project settings, form settings, publish details, domain details, change history */}
    </div>
  );
}
