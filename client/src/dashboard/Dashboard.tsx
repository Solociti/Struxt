export default function DashboardApp() {
  {
    /* open project settings, form settings, publish details, domain details, change history */
  }

  return (
    <>
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
                <span>Dashboard</span>
              </a>
            </li>

            <li>
              <a
                href="#"
                className="flex items-center p-3 rounded-md hover:bg-indigo-700"
              >
                <i className="fas fa-project-diagram mr-3"></i>
                <span>Projects</span>
              </a>
            </li>

            <li>
              <a
                href="#"
                className="flex items-center p-3 rounded-md hover:bg-indigo-700"
              >
                <i className="fas fa-calendar mr-3"></i>
                <span>Calendar</span>
              </a>
            </li>

            <li>
              <a
                href="#"
                className="flex items-center p-3 rounded-md hover:bg-indigo-700"
              >
                <i className="fas fa-file-alt mr-3"></i>
                <span>Documents</span>
              </a>
            </li>

            <li>
              <a
                href="#"
                className="flex items-center p-3 rounded-md hover:bg-indigo-700"
              >
                <i className="fas fa-chart-bar mr-3"></i>
                <span>Reports</span>
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

      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white p-4 flex items-center justify-between border-b">
          <div className="flex items-center w-64 bg-gray-100 rounded-md">
            <i className="fas fa-search text-gray-400 ml-3"></i>
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent p-2 outline-none flex-1"
            />
          </div>
          <div className="flex items-center">
            <button className="p-2 mr-2">
              <i className="far fa-bell"></i>
            </button>
            <div className="flex items-center">
              <img
                src="https://randomuser.me/api/portraits/women/2.jpg"
                alt="Profile"
                className="w-8 h-8 rounded-full mr-2"
              />
              <span>Tom Cook</span>
              <i className="fas fa-chevron-down ml-2 text-gray-500"></i>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <div className="border border-dashed border-gray-300 rounded-lg h-full bg-white bg-opacity-50 bg-stripes bg-stripes-gray-300">
            {/* Content would go here */}
          </div>
        </div>
      </div>
    </>
  );
}
