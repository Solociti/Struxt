import { useTheme } from "client/bootstrap/Theme";
import Navbar from "react-bootstrap/Navbar";
import { useCurrentUser } from "../auth/userCurrentUser";
import { useCurrentProject } from "../projects/ProjectContext";
import SelectProject from "../projects/SelectProject";
import NotificationsPopover from "./notifications/NotificationsPopover";

export function DashboardHeader() {
  const { user } = useCurrentUser();
  const { project, setProject } = useCurrentProject();
  const { theme } = useTheme();

  return (
    <Navbar className="p-2 border-bottom sticky-top" bg={theme}>
      {/* Logo */}
      <div className="d-md-none fs-4">
        <img src="/logo.svg" alt="Logo" width="32" height="32" />
      </div>

      <div className="flex-grow-1" style={{ width: "16rem" }}>
        <SelectProject allowAll project={project} updateProject={setProject} />
      </div>

      <div className="d-flex align-items-center">
        <NotificationsPopover />

        {/* User section */}
        <div className="d-flex align-items-center">
          {user && user.name ? (
            <div
              className="rounded-circle me-2 bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: "32px", height: "32px" }}
            >
              {user.name
                .split(" ")
                .map((n) => n.charAt(0).toUpperCase())
                .join("")}
            </div>
          ) : (
            <div
              className="rounded-circle me-2 bg-secondary text-white d-flex align-items-center justify-content-center"
              style={{ width: "32px", height: "32px" }}
            >
              ?
            </div>
          )}

          <span className="d-none d-sm-inline">
            {(user && user.name) || "..."}
          </span>
          <i className="fas fa-chevron-down ms-2 text-secondary"></i>
        </div>
      </div>
    </Navbar>
  );
}
