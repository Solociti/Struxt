import { formatDate } from "../../../common/format/date";
import { EnvironmentTypes } from "../../../common/models/projects/Environment";
import { ProjectDetails } from "../../../common/models/projects/ProjectDetails";

/**
 * Show the project env value information
 *
 * @param param0
 * @returns
 */
export function ProjectEnvInfo({
  envData,
  envLabel,
  project,
}: {
  envData: any;
  project: ProjectDetails;
  envLabel: EnvironmentTypes;
}) {
  return (
    <div className="border rounded-lg p-4 border-gray-200 bg-gray-50">
      <h3 className="text-lg font-semibold mb-2 capitalize">
        {envLabel} Environment
      </h3>
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700">Domains</h4>
        <ul className="text-sm">
          {project.domains
            .filter((d) => d.environment === envLabel)
            .map((domain) => (
              <li key={domain.id} className="flex items-center">
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
        <h4 className="text-sm font-medium text-gray-700">Latest Publish</h4>
        <p className="text-sm">
          {envData.published.timestamp
            ? `Published on ${formatDate(envData.published.timestamp)} by ${
                envData.published.displayName
              }`
            : "No recent publishes"}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Preview</h4>
        <div className="border border-gray-300 rounded overflow-hidden h-40 bg-gray-200">
          {envData.screenshot ? (
            <img
              src={envData.screenshot}
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
  );
}
