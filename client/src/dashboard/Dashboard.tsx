import { lazy, Suspense, useEffect } from "react";
import { Route, HashRouter as Router, Routes } from "react-router";
import { loadCurrentUser } from "../auth/user";
import { ProjectProvider } from "../projects/ProjectContext";
import { DashboardHeader } from "./Header";
import { DashboardSidebar } from "./Sidebar";

const DashboardContent = lazy(
  () => import("client/dashboard/DashboardContent")
);
const SettingsContent = lazy(
  () => import("client/dashboard/settings/SettingsContent")
);

export default function DashboardApp() {
  useEffect(() => {
    // Load the user data
    loadCurrentUser().catch((err) => {
      if (err.name === "Unauthorized") {
        location.assign("/auth/login");
      }
    });
  }, []);

  return (
    <Router>
      <ProjectProvider>
        <DashboardSidebar />
        <div className="w-50 hidden md:flex flex-col"></div>

        <div className="flex-1 flex flex-col">
          <DashboardHeader />

          {/* Content Area */}
          <div className="flex-1 p-6">
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<DashboardContent />} />
                <Route path="/settings" element={<SettingsContent />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </ProjectProvider>
    </Router>
  );
}
