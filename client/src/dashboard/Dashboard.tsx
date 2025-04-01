import { useEffect } from "react";
import { loadCurrentUser } from "../auth/user";
import { ProjectProvider } from "../projects/ProjectContext";
import { DashboardContent } from "./DashboardContent.tsx";
import { DashboardHeader } from "./Header";
import { DashboardSidebar } from "./Sidebar";

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
    <ProjectProvider>
      <DashboardSidebar />
      <div className="w-50 bg-indigo-600 text-white flex flex-col"></div>

      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        {/* Content Area */}
        <div className="flex-1 p-6">
          {/* Content would go here */}
          <DashboardContent />
        </div>
      </div>
    </ProjectProvider>
  );
}
