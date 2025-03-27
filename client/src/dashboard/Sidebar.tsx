/**
 * Create the side bar for the dashboards
 *
 * @returns
 */
export function DashboardSidebar() {
  return (
    <div className="w-50 bg-indigo-600 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <div className="text-2xl">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <a
              href="#"
              className="flex items-center p-3 rounded-md bg-indigo-700"
            >
              <i className="fas fa-home mr-3"></i>
              <span>Projects</span>
            </a>
          </li>

          <li>
            <a
              href="#"
              className="flex items-center p-3 rounded-md hover:bg-indigo-700"
            >
              <i className="fas fa-project-diagram mr-3"></i>
              <span>Assets</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* Settings */}
      <div className="mt-auto p-4">
        <a
          href="#"
          className="flex items-center p-3 rounded-md hover:bg-indigo-700"
        >
          <i className="fas fa-cog mr-3"></i>
          <span>Settings</span>
        </a>
      </div>
    </div>
  );
}
