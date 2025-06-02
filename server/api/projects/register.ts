import {
  ProjectDetailsApi,
  ProjectEditorApi,
  ProjectListApi,
} from "common/api/projects/project";
import {
  ProjectRolesApi,
  ProjectRolesInviteApi,
} from "common/api/projects/projectRoles";
import { customError } from "common/custom-error/custom-error";
import { roles } from "common/models/user/Roles";
import { registerApi } from "server/api/registerApi";
import { validateUserId } from "server/auth/user/getUser";
import { getProjectEditorData } from "./getProject";
import { getProjectDetails } from "./getProjectDetails";
import { getProjectsAdmin, getProjectsForUser } from "./getProjectList";
import { cancelUserInvite } from "./invites/cancelUserInvite";
import { getProjectInvitesList } from "./invites/getProjectUserInvites";
import { inviteUser } from "./invites/inviteUser";
import { getProjectInvite } from "./invites/projectInvite";
import {
  getProjectRoleVisualDocs,
  removeProjectUser,
  updateProjectRoles,
} from "./roles/projectRoles";
import { saveProjectEditorData } from "./saveProject";

registerApi<ProjectListApi>("/api/projects").get([], async ({ user }) => {
  // load the projects for an admin
  if (user.hasPermission(roles.struxt.admin)) {
    const rows = await getProjectsAdmin();

    const response = {
      list: rows,
    };

    return response;
  }

  const rows = await getProjectsForUser(user.id);

  const response = {
    list: rows,
  };

  return response;
});

registerApi<ProjectEditorApi>("/api/projects/:projectId/editor")
  .get([], async ({ user, params }) => {
    const projectId = params.projectId;

    // check if the user has access to the project
    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to view this project.",
        "Forbidden"
      );
    }

    // load the project editor details
    const response = await getProjectEditorData(projectId);
    return response;
  })
  .post(["struxt.editor"], async ({ user, params, body }) => {
    const projectId = params.projectId;

    // check if the user has access to the project
    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
        "Forbidden"
      );
    }

    // save the project editor data
    const response = await saveProjectEditorData(projectId, body.editorData);
    return response;
  });

registerApi<ProjectDetailsApi>("/api/projects/:projectId/details").get(
  [],
  async ({ user, params }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to view this project.",
        "Forbidden"
      );
    }

    const details = await getProjectDetails(projectId);

    return { details };
  }
);

registerApi<ProjectRolesApi>("/api/projects/:projectId/roles")
  .get([], async ({ user, params }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to view the project roles.",
        "Forbidden"
      );
    }

    const list = await getProjectRoleVisualDocs(projectId);
    return { list };
  })
  .post([], async ({ user, params, body }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.admin])
    ) {
      throw customError(
        403,
        "You do not have permission to update the project roles."
      );
    }

    // validate the user id
    const userIdValid = await validateUserId(body.userId);
    if (!body.userId || !userIdValid) {
      throw customError(403, "Invalid user selected.");
    }

    // update the roles in the database
    const document = await updateProjectRoles(
      projectId,
      body.userId,
      body.roles
    );
    return {
      success: true,
      item: document,
    };
  })
  .delete([], async ({ user, params, query }) => {
    const projectId = params.projectId;
    const userId = query.userId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.admin])
    ) {
      throw customError(
        403,
        "You do not have permission to remove users from this project."
      );
    }

    // validate the user id
    const userIdValid = await validateUserId(userId);
    if (!userId || !userIdValid) {
      throw customError(400, "Invalid user selected.");
    }

    // remove the user from the project
    const { success } = await removeProjectUser(projectId, userId);
    return {
      success,
    };
  });

registerApi<ProjectRolesInviteApi>("/api/projects/:projectId/roles/invite")
  .get([], async ({ user, params }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.admin])
    ) {
      throw customError(
        403,
        "You do not have permission to view the project invites."
      );
    }

    // get the list of invites for the project
    const list = await getProjectInvitesList(projectId);

    return {
      list,
    };
  })
  .post([], async ({ user, params, body }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.admin])
    ) {
      throw customError(
        403,
        "You do not have permission to invite users to this project.",
        "Forbidden"
      );
    }

    // TODO: check if the given email is valid

    // create the invite
    const invite = await inviteUser(
      projectId,
      body.email,
      body.roles,
      body.message,
      {
        userId: user.id,
        displayName: user.name,
      }
    );

    return {
      invite,
      success: true,
    };
  })
  .delete([], async ({ user, params, query }) => {
    const projectId = params.projectId;
    const inviteId = query.inviteId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.admin])
    ) {
      throw customError(
        403,
        "You do not have permission to delete this invite.",
        "Forbidden"
      );
    }

    const invite = await getProjectInvite(inviteId);
    if (!invite) {
      throw customError(404, "Invite not found.");
    }

    // check that the invite is for the current project
    if (invite.projectId !== projectId) {
      throw customError(404, "Invite not found for this project.");
    }

    // check if the invite is still valid
    const validResult = invite.isInviteValid();
    if (!validResult.valid) {
      throw customError(400, validResult.message);
    }

    // cancel the invite
    const success = await cancelUserInvite(invite, {
      userId: user.id,
      displayName: user.name,
    });

    return {
      success,
    };
  });
