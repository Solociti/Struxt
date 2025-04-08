import { useLoadAsync } from "client/api/useLoadAsync";
import { Button } from "client/components/Button";
import { Card } from "client/components/Card";
import { InputGroup, TextareaGroup } from "client/components/InputGroup";
import { TabCardWithState } from "client/components/TabCard";
import { useHtmlId } from "client/components/useHtmlId";
import { useCurrentProject } from "client/projects/ProjectContext";
import { getProjectDetails } from "client/projects/projects";
import { formatStorageSize } from "common/format/storageSize";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { useId, useState } from "react";

export default function SettingsContent() {
  const { id } = useHtmlId();

  const { project } = useCurrentProject();

  // load the project
  const {
    response: projectDetails,
    isLoading: loadingProjectDetails,
    error: projectDetailsError,
  } = useLoadAsync(async () => {
    if (project.id === "*") {
      return null;
    }

    // Load project details
    return await getProjectDetails(project.id);
  }, [project.id]);

  if (project.id === "*") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-4">Please select a project to continue...</p>
      </div>
    );
  }

  if (loadingProjectDetails) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  if (projectDetails) {
    return (
      <div>
        <h1 className="text-2xl text-gray-900">Settings</h1>

        <Card title="Project Details" className="my-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup
              label="Project Name"
              value={project.name}
              onChange={(name: string) => {
                // handle project name change
                console.log({ name });
              }}
            />

            <InputGroup label="Project Id" value={project.id} disabled />
          </div>

          <TextareaGroup
            className="mt-4"
            label="Project Description"
            value={project.description}
            onChange={(description: string) => {
              // handle project description change
              console.log({ description });
            }}
            placeholder="Project Description"
          />
        </Card>

        {/* TODO: add users access control */}

        <Card title="Storage Usage" className="my-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">
              {formatStorageSize(projectDetails.storage.usedBytes)}
            </p>
            <p className="text-sm text-gray-600">
              {formatStorageSize(projectDetails.storage.maxBytes)}
            </p>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={
                "h-full " +
                (projectDetails.storage.usedBytes /
                  projectDetails.storage.maxBytes >
                0.8
                  ? "bg-red-600"
                  : "bg-blue-600")
              }
              style={{
                width: `${Math.min(
                  100,
                  (projectDetails.storage.usedBytes /
                    projectDetails.storage.maxBytes) *
                    100
                )}%`,
              }}
            ></div>
          </div>
        </Card>

        <TabCardWithState
          tabs={[
            { label: "Production", id: "production" },
            { label: "Staging", id: "staging" },
          ]}
          className="my-8"
          render={(env) => {
            return (
              <EnvironmentSettings
                environment={env as EnvironmentTypes}
                project={projectDetails}
              />
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-4">Project details not found.</p>
    </div>
  );
}

function EnvironmentSettings({
  environment,
  project,
}: {
  environment: EnvironmentTypes;
  project: ProjectDetails;
}) {
  const htmlId = useId();

  const [showAddDomain, setShowAddDomain] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
          {environment} Environment
        </h3>

        <div className="flex items-start mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              Last published by
            </p>
            <p className="text-sm text-gray-900">John Doe on April 5, 2025</p>
          </div>

          {/* <button className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Deploy to Production
          </button> */}
        </div>

        <div className="mt-6">
          <h4 className="text-base font-medium text-gray-900 mb-3">
            Custom Domains
          </h4>
          <div className="bg-gray-50 border border-gray-200 rounded-md mb-4">
            <ul className="divide-y divide-gray-200">
              <li className="py-3 px-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    example.com
                  </span>
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Primary
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M11 5a1 1 0 112 0v8a1 1 0 11-2 0V5zm-6 4a1 1 0 112 0v4a1 1 0 11-2 0V9z" />
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </li>
              <li className="py-3 px-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    www.example.com
                  </span>
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    SSL Enabled
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() => {
                setShowAddDomain(true);
              }}
            >
              Add Domain
            </Button>
          </div>

          <div className="mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">
                Add a Domain
              </h5>
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="domain-type"
                      value="custom"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Custom Domain
                    </span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="yourdomain.com"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="domain-type"
                      value="free"
                      checked
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Free Subdomain
                    </span>
                  </label>
                  <div className="mt-2 flex">
                    <input
                      type="text"
                      placeholder="your-project"
                      className="flex-1 block border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm rounded-r-md">
                      .sitehost.com
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox text-indigo-600"
                      checked
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable SSL
                    </span>
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="ssl-email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    SSL Email (for certificate notifications)
                  </label>
                  <input
                    type="email"
                    id="ssl-email"
                    placeholder="you@example.com"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Add Domain
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
        <div className="bg-gray-100 border border-gray-200 rounded-md h-64 flex items-center justify-center">
          <img
            src="/api/placeholder/400/320"
            alt="Production site preview"
            className="max-w-full max-h-full rounded shadow"
          />
        </div>
      </div>
    </div>
  );
}
