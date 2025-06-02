import { SetupErrorSnackBar } from "client/components/ErrorSnackBar";
import { lazy, Suspense, useEffect } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Route, HashRouter as Router, Routes } from "react-router";
import { loadCurrentUser } from "../auth/user";
import { ProjectProvider } from "../projects/ProjectContext";
import { DashboardHeader } from "./Header";
import { DashboardSidebar } from "./Sidebar";

import "client/bootstrap/bootstrap.scss";

const DashboardContent = lazy(
  () => import("client/dashboard/DashboardContent")
);
const SettingsContent = lazy(
  () => import("client/dashboard/settings/SettingsContent")
);
const MetricsPage = lazy(() => import("client/dashboard/metrics/MetricsPage"));

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

        <div className="d-flex flex-column flex-grow-1">
          <DashboardHeader />

          {/* Content Area */}
          <div className="p-3">
            <Suspense
              fallback={
                <div className="d-flex flex-column justify-content-center align-items-center my-5">
                  <Spinner animation="border" variant="secondary" />

                  <span className="ms-2 text-muted">Loading Page...</span>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<DashboardContent />} />
                <Route path="/settings" element={<SettingsContent />} />
                <Route path="/metrics" element={<MetricsPage />} />
              </Routes>
            </Suspense>
          </div>
        </div>

        {/* Add the error snack bar */}
        <SetupErrorSnackBar />
      </ProjectProvider>
    </Router>
  );
}
