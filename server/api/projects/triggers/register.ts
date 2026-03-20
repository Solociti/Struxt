import { ProjectTriggersApi } from "common/api/projects/triggers";
import { customError } from "common/custom-error/custom-error";
import { roles } from "common/models/user/Roles";
import { registerApi } from "server/api/registerApi";
import z from "zod";
import { getProjectDetails } from "../getProjectDetails";
import { updateProjectTriggers } from "./updateTriggers";

registerApi<ProjectTriggersApi>("/api/projects/:projectId/triggers").post(
  [],
  async ({ body, params, user }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
        "Forbidden",
      );
    }

    const parsed = z
      .object({
        httpTriggers: z.array(
          z.object({
            endpoint: z.string().min(1),
            method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
            assetId: z.string().min(5),
            handler: z.string(),
            environmentId: z.string().min(1),
          }),
        ),
        cronTriggers: z.array(
          z.object({
            cronExpression: z.string().min(1),
            assetId: z.string().min(5),
            handler: z.string(),
            environmentId: z.string().min(1),
          }),
        ),
      })
      .partial()
      .parse(body);

    if (!parsed.httpTriggers && !parsed.cronTriggers) {
      throw customError(
        400,
        "At least one of httpTriggers or cronTriggers must be provided.",
      );
    }

    // update the project routine environments
    await updateProjectTriggers(projectId, parsed);

    const details = await getProjectDetails(projectId);
    return { success: true, details };
  },
);
