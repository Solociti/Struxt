import { customError } from "common/custom-error/custom-error";
import { CurrentUserModel } from "common/models/user/CurrentUserModel";
import { roles } from "common/models/user/Roles";
import { getAiPilotFeatureFlags } from "server/aiPilot/chat/projectTokens";

/**
 * Check if the user has permission to access AI Pilot features for a project.
 *
 * Throws the appropriate error if not.
 *
 * Returns the AI Pilot feature flags for the project if access is granted.
 *
 * @param user
 * @param projectId
 * @returns
 */
export async function aiPilotPermCheck(
  user: CurrentUserModel,
  projectId: string
) {
  // check if the user has access to the project
  if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
    throw customError(
      403,
      "You do not have permission to modify this project."
    );
  }

  if (
    !user.hasPermission([{ and: [roles.struxt.editor, roles.struxt.aiPilot] }])
  ) {
    throw customError(402, "You do not have access to AI Pilot features.");
  }

  // load the project
  const aiPilotFlags = await getAiPilotFeatureFlags(projectId);

  if (!aiPilotFlags.enabled) {
    throw customError(402, "AI Pilot is not enabled for this project");
  }

  return aiPilotFlags;
}
