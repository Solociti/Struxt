import { useCurrentUser } from "../auth/userCurrentUser";
import SelectProject from "../projects/SelectProject";

export function DashboardHeader() {
  const { user, hasPermission } = useCurrentUser();

  return (
    <div className="bg-white p-4 flex items-center justify-between border-b">
      <div className="flex items-center w-64 bg-gray-100 rounded-md">
        <SelectProject allowAll />
      </div>
      <div className="flex items-center">
        <button className="p-2 mr-2">
          <i className="far fa-bell"></i>
        </button>

        {/* add the user section */}
        <div className="flex items-center">
          {user && user.name ? (
            <div className="w-8 h-8 rounded-full mr-2 bg-blue-500 flex items-center justify-center text-white font-medium">
              {user.name
                .split(" ")
                .map((n) => n.charAt(0).toUpperCase())
                .join("")}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center text-white font-medium">
              ?
            </div>
          )}

          <span>{(user && user.name) || "..."}</span>

          <i className="fas fa-chevron-down ml-2 text-gray-500"></i>
        </div>
      </div>
    </div>
  );
}
