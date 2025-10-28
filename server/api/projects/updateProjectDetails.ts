import { ProjectDetailsApi } from "common/api/projects/project";
import { UserModel } from "common/models/user/UserModel";
import setValue from "set-value";
import { getProjectData } from "./getProject";
import { saveProject } from "./saveProject";
/**
 * Update the project details property on the server
 *
 * @param projectId
 * @param propPath
 * @param value
 */
export async function updateProjectDetails(
  projectId: string,
  propPath: ProjectDetailsApi["PostBody"]["propPath"],
  value: any,
  user: UserModel
) {
  const project = await getProjectData(projectId);

  // update the project details in the database
  setValue(project, propPath, value);

  project.updated = {
    ...project.updated,
    date: Math.floor(Date.now() / 1000),
    userId: user.id,
    displayName: user.name,
  };

  await saveProject(project);

  return {
    success: true,
  };
}
