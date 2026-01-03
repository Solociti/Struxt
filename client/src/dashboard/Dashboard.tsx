import { SetupErrorSnackBar } from "client/components/ErrorSnackBar";
import ToastTopProvider from "client/components/ToastTop";
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
const RoutinesPage = lazy(() => import("client/routines/RoutinesPage"));
const AdminSettingsPage = lazy(
  () => import("client/dashboard/admin/AdminSettingsPage")
);
const SnapshotsContent = lazy(
  () => import("client/dashboard/snapshots/EditorSnapshotsContent")
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

        <div
          className="d-flex flex-column flex-grow-1"
          style={{ height: "100vh" }}
        >
          <DashboardHeader />

          {/* Content Area */}
          <Suspense
            fallback={
              <div className="d-flex flex-column justify-content-center align-items-center p-3 my-5">
                <Spinner animation="border" variant="secondary" />

                <span className="ms-2 text-muted">Loading Page...</span>
              </div>
            }
          >
            <Routes>
              <Route
                path="*"
                element={
                  <div className="d-flex flex-column align-items-center my-5 text-muted">
                    <h1>Page Not Found</h1>

                    <p>The page you are looking for does not exist.</p>
                  </div>
                }
              />

              <Route path="/" element={<DashboardContent />} />
              <Route path="/settings" element={<SettingsContent />} />
              <Route path="/routines" element={<RoutinesPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              <Route path="/snapshots" element={<SnapshotsContent />} />
              <Route path="/admin" element={<AdminSettingsPage />} />
            </Routes>
          </Suspense>
        </div>

        {/* Add the error snack bar */}
        <SetupErrorSnackBar />
        <ToastTopProvider />
      </ProjectProvider>
    </Router>
  );
}
