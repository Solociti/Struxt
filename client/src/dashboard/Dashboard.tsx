import { useEffect } from "react";
import { loadCurrentUser } from "../auth/user";
import { ProjectProvider } from "../projects/ProjectContext";
import { DashboardHeader } from "./Header";
import { DashboardSidebar } from "./Sidebar";

export default function DashboardApp() {
  /**
   *  open project settings,
   * form settings,
   * publish details,
   * domain details,
   * change history
   */

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

      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        {/* Content Area */}
        <div className="flex-1 p-6">
          <div className="border border-dashed border-gray-300 rounded-lg h-full bg-white bg-opacity-50 bg-stripes bg-stripes-gray-300">
            {/* Content would go here */}
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
}
