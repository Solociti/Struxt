import { useEffect } from "react";
import { loadCurrentUser } from "../auth/user";
import { ProjectProvider } from "../projects/ProjectContext";
import { DashboardHeader } from "./Header";
import { DashboardSidebar } from "./Sidebar";
import { ProjectDetails } from "../../../common/models/projects/ProjectDetails";

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

  const currentProject: ProjectDetails = {
    name: "Project Name",
    description: "Project description goes here",
    owner: {
      userId: "123",
      displayName: "John Doe",
    },

    domains: [
      {
        id: 1,
        domain: "example.com",
        environment: "production",
        ssl: true,
      },
      {
        id: 2,
        domain: "www.example.com",
        environment: "production",
        ssl: true,
      },
      {
        id: 3,
        domain: "staging.example.com",
        environment: "staging",
        ssl: true,
      },
    ],

    staging: {
      published: {
        userId: "123",
        displayName: "Jane Doe",
        timestamp: Date.now(),
      },
      screenshot: "https://via.placeholder.com/300x150",
    },

    production: {
      published: {
        userId: "123",
        displayName: "Jane Doe",
        timestamp: Date.now(),
      },
      screenshot: "https://via.placeholder.com/300x150",
    },

    forms: [
      { formName: "Contact Form", submissionCount: 10, enabled: true },
      { formName: "Newsletter Signup", submissionCount: 20, enabled: true },
    ],
  };

  return (
    <ProjectProvider>
      <DashboardSidebar />

      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        {/* Content Area */}
        <div className="flex-1 p-6">
          <div className="border border-dashed border-gray-300 rounded-lg h-full bg-white bg-opacity-50 bg-stripes bg-stripes-gray-300">
            {/* Content would go here */}

            <div className="project-card p-6">
              {/* Project header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {currentProject?.name || "Project Name"}
                  </h2>
                  <p className="text-gray-600">
                    {currentProject?.description ||
                      "Project description goes here"}
                  </p>
                </div>
                {currentProject?.owner && (
                  <div className="text-sm text-gray-500">
                    Owned by: {currentProject.owner.displayName}
                  </div>
                )}
              </div>

              {/* Environments section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Staging Environment */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Staging Environment
                  </h3>
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Domains
                    </h4>
                    <ul className="text-sm">
                      {currentProject?.domains
                        .filter((d) => d.environment === "staging")
                        .map((domain) => (
                          <li key={domain.id} className="flex items-center">
                            <span className="mr-2">●</span>
                            <a
                              href={`https://${domain.domain}`}
                              className="text-blue-600 hover:underline"
                            >
                              {domain.domain}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Latest Publish
                    </h4>
                    <p className="text-sm">
                      {currentProject?.staging.published
                        ? `Published on ${new Date(
                            currentProject.staging.published.timestamp
                          ).toLocaleDateString()} by ${
                            currentProject.staging.published.displayName
                          }`
                        : "No recent publishes"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Preview
                    </h4>
                    <div className="border rounded overflow-hidden h-40 bg-gray-100">
                      {currentProject?.staging.screenshot ? (
                        <img
                          src={currentProject.staging.screenshot}
                          alt="Staging site preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No preview available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Production Environment */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Production Environment
                  </h3>
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Domains
                    </h4>
                    <ul className="text-sm">
                      {currentProject?.domains
                        .filter((d) => d.environment === "production")
                        .map((domain) => (
                          <li key={domain.id} className="flex items-center">
                            <span className="mr-2">●</span>
                            <a
                              href={`https://${domain.domain}`}
                              className="text-blue-600 hover:underline"
                            >
                              {domain.domain}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Latest Publish
                    </h4>
                    <p className="text-sm">
                      {currentProject?.production.published
                        ? `Published on ${new Date(
                            currentProject.production.published.timestamp
                          ).toLocaleDateString()} by ${
                            currentProject.production.published.displayName
                          }`
                        : "No recent publishes"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Preview
                    </h4>
                    <div className="border rounded overflow-hidden h-40 bg-gray-100">
                      {currentProject?.production.screenshot ? (
                        <img
                          src={currentProject.production.screenshot}
                          alt="Production site preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No preview available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Forms section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Forms</h3>
                {currentProject?.forms?.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Form Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submissions (30 days)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentProject.forms.map((form, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {form.formName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {form.submissionCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No forms available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
}
