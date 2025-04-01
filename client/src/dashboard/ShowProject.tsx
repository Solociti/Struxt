import { ProjectDetails } from "../../../common/models/projects/ProjectDetails";
import { ProjectEnvInfo } from "./ProjectEnvInfo";

export function ShowProject({ project }: { project: ProjectDetails }) {
  return (
    <div className="p-6 my-4 bg-white shadow rounded-lg">
      {/* Project header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">
            {project.name || "Project Name"}
          </h2>
          <p className="text-gray-600">{project.description}</p>
        </div>
      </div>

      {/* Environments section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Staging Environment */}
        {project && (
          <ProjectEnvInfo
            envData={project.staging}
            envLabel="staging"
            project={project}
          />
        )}

        {/* Production Environment */}
        {project && (
          <ProjectEnvInfo
            envData={project.production}
            envLabel="production"
            project={project}
          />
        )}
      </div>

      {/* Forms section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Forms</h3>
        {project.forms?.length > 0 ? (
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
                {project.forms.map((form, i) => (
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
  );
}
