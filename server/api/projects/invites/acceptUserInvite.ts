import { customError } from "common/custom-error/custom-error";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";

/**
 * Accepts the user invite to a project.
 *
 * @param invite
 */
export async function acceptUserInvite(
  invite: ProjectRolesInviteModel
): Promise<void> {
  // check if the invite is valid
  const { valid, message } = invite.isInviteValid();
  if (!valid) {
    throw customError(400, message);
  }

  // TODO: create a project role for the user
}
