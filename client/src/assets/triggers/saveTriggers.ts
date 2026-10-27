import { postApi } from "client/api/api";
import { ProjectTriggersApi } from "common/api/projects/triggers";
import { CronTrigger, HttpTrigger } from "common/models/projects/Triggers";

/**
 * Save the given triggers to the project details.
 *
 * @param projectId
 * @param triggers
 */
export async function saveTriggers(
  projectId: string,
  triggers: Partial<{
    httpTriggers: HttpTrigger[];
    cronTriggers: CronTrigger[];
  }>,
) {
  const response = await postApi<ProjectTriggersApi>(
    ["/api/projects", projectId, "triggers"],
    triggers,
  );

  return response;
}
