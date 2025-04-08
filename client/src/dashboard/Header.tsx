import { useCurrentUser } from "../auth/userCurrentUser";
import { useCurrentProject } from "../projects/ProjectContext";
import SelectProject from "../projects/SelectProject";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";

export function DashboardHeader() {
  const { user } = useCurrentUser();
  const { project, setProject } = useCurrentProject();

  return (
    <Navbar bg="white" className="p-2 border-bottom sticky-top">
      {/* Logo */}
      <div className="d-md-none fs-4">
        <img src="/logo.svg" alt="Logo" width="32" height="32" />
      </div>

      <div className="flex-grow-1" style={{ width: "16rem" }}>
        <SelectProject allowAll project={project} updateProject={setProject} />
      </div>

      <div className="d-flex align-items-center">
        <Button variant="light" className="me-2 p-2" aria-label="Notifications">
          <i className="far fa-bell"></i>
          {/* TODO: setup the notifications */}
        </Button>

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

          <span>{(user && user.name) || "..."}</span>
          <i className="fas fa-chevron-down ms-2 text-secondary"></i>
        </div>
      </div>
    </Navbar>
  );
}
