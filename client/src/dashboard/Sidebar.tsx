import { useCurrentUser } from "client/auth/userCurrentUser";
import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import { usePromptModal } from "client/components/modals/usePromptModal";
import { useCurrentProject } from "client/projects/ProjectContext";
import { createNewProject } from "client/projects/projects";
import { useEffect, useState } from "react";
import Nav from "react-bootstrap/Nav";
import { useLocation } from "react-router";

type SidebarMode = "narrow" | "wide";

const sidebarModeKey = "sidebar-mode";
const narrowWidth = "60px";
const wideWidth = "150px";
const mobileBreakpoint = 768;

/**
 * Returns the initial sidebar mode based on localStorage or the viewport width.
 */
function getInitialMode(): SidebarMode {
  const stored = localStorage.getItem(sidebarModeKey);
  if (stored === "narrow" || stored === "wide") {
    return stored;
  }
  return window.innerWidth < mobileBreakpoint ? "narrow" : "wide";
}

/**
 * Create the side bar for the dashboards
 *
 * @returns
 */
export function DashboardSidebar() {
  const location = useLocation();
  const { hasPermission } = useCurrentUser();
  const { setProject } = useCurrentProject();
  const [mode, setMode] = useState<SidebarMode>(getInitialMode);

  useEffect(() => {
    localStorage.setItem(sidebarModeKey, mode);
  }, [mode]);

  const isWide = mode === "wide";
  const sidebarWidth = isWide ? wideWidth : narrowWidth;
  const sidebarTransition = {
    width: sidebarWidth,
    transition: "width 0.2s ease",
    overflow: "hidden",
  };

  function toggleMode() {
    setMode((prev) => (prev === "wide" ? "narrow" : "wide"));
  }

  function navLinkClass(path: string) {
    return (
      "text-light" + (location.pathname === path ? " bg-primary bg-600" : "")
    );
  }

  const newProjectModal = usePromptModal({
    title: "Create New Project",
    message: "Enter the name of the new project:",
    confirmButtonText: "Create",
    onConfirm: async (name: string) => {
      if (name.trim().length < 3) {
        throw new Error("Project name must be at least 3 characters long.");
      }

      const result = await createNewProject(name);
      if (result.success) {
        setProject(result.projectItem);
      } else {
        throw new Error("Unknown error creating project.");
      }
    },
  });

  return (
    <div
      className="d-flex flex-column bg-primary bg-500 text-white h-100 align-items-center"
      style={sidebarTransition}
    >
      <div
        className="p-3 d-flex align-items-center"
        style={{ cursor: "pointer", flexShrink: 0 }}
        onClick={toggleMode}
      >
        <img src="/dashboard/logo.svg" alt="Logo" width="32" height="32" />
      </div>

      <Nav variant="pills" className="flex-column">
        {hasPermission("struxt.admin") && (
          <Nav.Item className="mb-3 text-center">
            <IconButton
              variant="outline-light"
              icon="add"
              className="text-nowrap px-2"
              onClick={() => newProjectModal.showPrompt()}
            >
              {isWide && "New Project"}
            </IconButton>

            {newProjectModal.promptModal}
          </Nav.Item>
        )}

        <Nav.Item>
          <Nav.Link
            className={navLinkClass("/")}
            href="#/"
            active={location.pathname === "/"}
          >
            <MaterialIcon>home</MaterialIcon>
            {isWide && "Projects"}
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link
            className={navLinkClass("/metrics")}
            href="#/metrics"
            active={location.pathname === "/metrics"}
          >
            <MaterialIcon>analytics</MaterialIcon>
            {isWide && "Metrics"}
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link
            className={navLinkClass("/snapshots")}
            href="#/snapshots"
            active={location.pathname === "/snapshots"}
          >
            <MaterialIcon>heap_snapshot_large</MaterialIcon>
            {isWide && "Snapshots"}
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link
            className={navLinkClass("/settings")}
            href="#/settings"
            active={location.pathname === "/settings"}
          >
            <MaterialIcon>settings</MaterialIcon>
            {isWide && "Settings"}
          </Nav.Link>
        </Nav.Item>

        <hr />

        <Nav.Item>
          <Nav.Link className="text-light" href="/auth/logout">
            <MaterialIcon>logout</MaterialIcon>
            {isWide && "Logout"}
          </Nav.Link>
        </Nav.Item>

        {hasPermission("struxt.admin") && (
          <>
            <hr />

            <Nav.Item className="mb-3">
              <Nav.Link
                className={navLinkClass("/admin")}
                href="#/admin"
                active={location.pathname === "/admin"}
              >
                <MaterialIcon>admin_panel_settings</MaterialIcon>
                {isWide && "Admin"}
              </Nav.Link>
            </Nav.Item>
          </>
        )}
      </Nav>
    </div>
  );
}
