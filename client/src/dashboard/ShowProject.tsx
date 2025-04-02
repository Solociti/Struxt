import { ProjectDetails } from "../../../common/models/projects/ProjectDetails";
import { useCurrentUser } from "../auth/userCurrentUser";
import { AnchorButton, Button } from "../components/Button";
import { ProjectEnvInfo } from "./ProjectEnvInfo";

export function ShowProject({ project }: { project: ProjectDetails }) {
  const { user } = useCurrentUser();

  return (
    <div className="p-6 my-4 bg-white shadow rounded-lg border border-gray-200">
      {/* Project header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">
            {project.name || "Project Name"}
          </h2>
          <p className="text-gray-600">{project.description}</p>
        </div>

        {user && user.hasPermission("struxt.editor") && (
          <div>
            <AnchorButton
              variant="primary"
              outline
              href={"/editor/?projectId=" + project.id}
              target="_blank"
            >
              Edit
            </AnchorButton>

            <Button
              variant="secondary"
              outline
              disabled
              onClick={() => {
                /* Handle settings click */
                console.log("Settings clicked");
              }}
            >
              Settings
            </Button>
          </div>
        )}
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
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
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
          <p className="text-sm text-gray-500">No form submissions</p>
        )}
      </div>
    </div>
  );
}
