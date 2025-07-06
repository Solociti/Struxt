import { ProjectCreateApi } from "common/api/projects/project";
import { newProjectEditorData } from "common/models/projects/newProjectEditorData";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { createSimpleId } from "server/utils/createId";
import { saveProject } from "./saveProject";

/**
 * Creates a new project and saves it to the database.
 *
 * @param name
 * @param user
 */
export async function createNewProject(
  name: string,
  user: { userId: string; displayName: string }
): Promise<ProjectCreateApi["PostResponse"]> {
  const date = Math.floor(Date.now() / 1000);
  const projectId = await createSimpleId("project");

  const project = new ProjectModel({
    projectId,
    name,
    storage: {
      maxBytes: 1024 * 1024 * 1024,
    },
    editorData: JSON.parse(JSON.stringify(newProjectEditorData)),
    created: {
      ...user,
      date,
    },
    updated: {
      ...user,
      date,
    },
  });

  // save the project to the database
  await saveProject(project);

  return {
    success: true,
    projectId,

    projectItem: {
      projectId: project.projectId,
      name: project.name,
      description: project.description,
    },
  };
}
