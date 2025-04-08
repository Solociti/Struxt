import { useLocation } from "react-router";

/**
 * Create the side bar for the dashboards
 *
 * @returns
 */
export function DashboardSidebar() {
  const location = useLocation();

  return (
    <div className="w-50 bg-indigo-600 text-white hidden md:flex flex-col fixed left-0 top-0 h-full">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <div className="text-2xl">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <SidebarItem
            label="Projects"
            hash="/"
            activeHash={location.pathname}
          />

          <SidebarItem
            label="Settings"
            hash="/settings"
            activeHash={location.pathname}
          />
        </ul>
      </nav>

      {/* Bottom section */}
      {/* <div className="mt-auto p-4">
        <SidebarItem />
      </div> */}
    </div>
  );
}

function SidebarItem({
  label,
  hash,
  activeHash,
}: {
  label: string;
  hash: string;
  activeHash: string;
}) {
  return (
    <li>
      <a
        href={`#${hash}`}
        className={`flex items-center p-3 rounded-md ${
          activeHash === hash ? "bg-indigo-700" : "hover:bg-indigo-700"
        }`}
      >
        <i className="fas fa-home mr-3"></i>
        <span>{label}</span>
      </a>
    </li>
  );
}
