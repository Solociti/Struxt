import { useCurrentUser } from "client/auth/userCurrentUser";
import IconButton from "client/components/IconButton";
import { usePromptModal } from "client/components/modals/usePromptModal";
import { useCurrentProject } from "client/projects/ProjectContext";
import { createNewProject } from "client/projects/projects";
import Nav from "react-bootstrap/Nav";
import { useLocation } from "react-router";

const sidebarStyle = {
  width: "150px",
};

/**
 * Create the side bar for the dashboards
 *
 * @returns
 */
export function DashboardSidebar() {
  const location = useLocation();
  const { hasPermission } = useCurrentUser();
  const { setProject } = useCurrentProject();

  // setup the modal to get the new project name
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

  // TODO: improve the sidebar colour scheme
  return (
    <>
      <div
        className="d-none d-md-flex flex-column bg-primary bg-500 text-white position-fixed fixed-top h-100 p-2"
        style={{ ...sidebarStyle }}
      >
        {/* Logo */}
        <div className="p-3 d-flex align-items-center">
          <div className="fs-4">
            <img src="/dashboard/logo.svg" alt="Logo" width="32" height="32" />
          </div>
        </div>

        {/* Main Navigation */}
        <Nav variant="pills" className="flex-column">
          {hasPermission("struxt.admin") && (
            <Nav.Item className="mb-3">
              <IconButton
                variant="outline-light"
                icon="add"
                className="text-nowrap"
                onClick={async () => {
                  newProjectModal.showPrompt();
                }}
              >
                New Project
              </IconButton>

              {newProjectModal.promptModal}
            </Nav.Item>
          )}

          <Nav.Item className="">
            <Nav.Link
              className={
                "text-light" +
                (location.pathname === "/" ? " bg-primary bg-600" : "")
              }
              href="#/"
              active={location.pathname === "/"}
            >
              <i className="fas fa-home me-2"></i>
              Projects
            </Nav.Link>
          </Nav.Item>

          <Nav.Item className="">
            <Nav.Link
              className={
                "text-light" +
                (location.pathname === "/metrics" ? " bg-primary bg-600" : "")
              }
              href="#/metrics"
              active={location.pathname === "/metrics"}
            >
              <i className="fas fa-cog me-2"></i>
              Metrics
            </Nav.Link>
          </Nav.Item>

          <Nav.Item className="">
            <Nav.Link
              className={
                "text-light" +
                (location.pathname === "/settings" ? " bg-primary bg-600" : "")
              }
              href="#/settings"
              active={location.pathname === "/settings"}
            >
              <i className="fas fa-cog me-2"></i>
              Settings
            </Nav.Link>
          </Nav.Item>

          <hr />

          <Nav.Item>
            <Nav.Link className="text-light" href="/auth/logout">
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      <div className="d-none d-md-block" style={{ ...sidebarStyle }}></div>
    </>
  );
}
