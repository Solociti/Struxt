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
            <img src="/logo.svg" alt="Logo" width="32" height="32" />
          </div>
        </div>

        {/* Main Navigation */}
        <Nav variant="pills" className="flex-column">
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
                (location.pathname === "/settings" ? " bg-primary bg-600" : "")
              }
              href="#/settings"
              active={location.pathname === "/settings"}
            >
              <i className="fas fa-cog me-2"></i>
              Settings
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      <div className="d-none d-md-block" style={{ ...sidebarStyle }}></div>
    </>
  );
}
