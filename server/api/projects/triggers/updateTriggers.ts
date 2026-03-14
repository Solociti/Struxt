import { customError } from "common/custom-error/custom-error";
import { CronTrigger, HttpTrigger } from "common/models/projects/Triggers";
import { getProjectData } from "../getProject";
import { saveProject } from "../saveProject";

/**
 * Updates the project's triggers with the given HTTP and Cron triggers.
 *
 * @param projectId
 * @param triggers
 * @returns
 */
export async function updateProjectTriggers(
  projectId: string,
  triggers: Partial<{
    httpTriggers: HttpTrigger[];
    cronTriggers: CronTrigger[];
  }>,
) {
  const project = await getProjectData(projectId);
  if (!project) {
    throw customError(404, "Project not found");
  }

  if (triggers.httpTriggers) {
    project.update({
      featureFlags: {
        routines: {
          httpTriggers: triggers.httpTriggers,
        },
      },
    });
  }

  if (triggers.cronTriggers) {
    project.update({
      featureFlags: {
        routines: {
          cronTriggers: triggers.cronTriggers,
        },
      },
    });
  }

  await saveProject(project);

  return project;
}
