import {
  ProjectCreateApi,
  ProjectDeleteApi,
  ProjectDetailsApi,
  ProjectEditorApi,
  ProjectListApi,
  ProjectListFilter,
} from "common/api/projects/project";
import {
  ProjectRolesApi,
  ProjectRolesInviteApi,
} from "common/api/projects/projectRoles";
import { customError } from "common/custom-error/custom-error";
import { EditorData } from "common/models/projects/editorDataTypes";
import { roles } from "common/models/user/Roles";
import { zSimpleIdValidation } from "common/models/zValidation";
import "server/api/domains/register";
import "server/api/projects/snapshots/register";
import { registerApi } from "server/api/registerApi";
import { validateUserId } from "server/auth/user/getUser";
import { validateEmailAddress } from "server/utils/validateEmailAddress";
import z from "zod";
import { createNewProject } from "./createNewProject";
import {
  checkProjectDeleted,
  restoreProject,
  scheduleProjectDelete,
} from "./deleteProject";
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
import { createEditorSnapshot } from "./snapshots/saveEditorSnapshot";
import { updateProjectDetails } from "./updateProjectDetails";

registerApi<ProjectListApi>("/api/projects").get(
  [],
  async ({ user, query }) => {
    const {
      search,
      showDeleted,
      page: pageStr,
      count: countStr,
    } = z
      .object({
        search: z.string().optional(),
        showDeleted: z.string().optional(),
        page: z.string().optional(),
        count: z.string().optional(),
      })
      .parse(query);

    const page = parseInt(pageStr || "0");
    const count = parseInt(countStr || "10");

    const filter: ProjectListFilter = {
      search: search || "",
      showDeleted: showDeleted === "true",
      page,
      count,
    };

    // load the projects for an admin
    if (user.hasPermission(roles.struxt.admin)) {
      const rows = await getProjectsAdmin(filter);

      const response = {
        list: rows,
      };

      return response;
    }

    const rows = await getProjectsForUser(user.id, filter);

    const response = {
      list: rows,
    };

    return response;
  },
);

registerApi<ProjectCreateApi>("/api/projects/new").post(
  [roles.struxt.admin],
  async ({ user, body }) => {
    if (typeof body.name !== "string" || body.name.trim().length < 3) {
      throw customError(
        400,
        "Project name must be at least 3 characters long.",
      );
    }

    return await createNewProject(body.name.trim(), {
      userId: user.id,
      displayName: user.name,
    });
  },
);

registerApi<ProjectEditorApi>("/api/projects/:projectId/editor", {
  bodySanitization: {
    editorData: {
      skipSanitize: true,
    },
  },
})
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
        "Forbidden",
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
        "Forbidden",
      );
    }

    if (await checkProjectDeleted(projectId)) {
      throw customError(400, "Project is scheduled for deletion.");
    }

    // save the project editor data
    const response = await saveProjectEditorData(projectId, body.editorData);

    // save the project editor snapshot
    await createEditorSnapshot(
      projectId,
      "save",
      body.editorData as EditorData,
      {
        userId: user.id,
        displayName: user.name,
      },
    );

    return response;
  });

registerApi<ProjectDetailsApi>("/api/projects/:projectId/details")
  .get([], async ({ user, params }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to view this project.",
        "Forbidden",
      );
    }

    const details = await getProjectDetails(projectId);

    return { details };
  })
  .post([], async ({ user, params, body }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
      );
    }

    if (await checkProjectDeleted(projectId)) {
      throw customError(400, "Project is scheduled for deletion.");
    }

    // check validity of input shape and props with zod
    const { value, propPath } = z
      .object({
        propPath: z.enum([
          "name",
          "description",
          "featureFlags.aiPilot.enabled",
          "featureFlags.aiPilot.settings.monthlyAllowance",
        ]),
        value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
      })
      .parse(body);

    // for non-admin users, check if they are allowed to modify the given property
    const allowUserProps = ["name", "description"];
    if (
      !user.hasPermission(roles.struxt.admin) &&
      !allowUserProps.includes(propPath)
    ) {
      throw customError(
        403,
        "You do not have permission to modify this project property.",
      );
    }

    // update the project property
    const { success } = await updateProjectDetails(
      projectId,
      propPath,
      value,
      user,
    );

    return {
      success,
      details: await getProjectDetails(projectId),
    };
  });

registerApi<ProjectDeleteApi>("/api/projects/:projectId/delete")
  .delete([], async ({ user, params }) => {
    const projectId = zSimpleIdValidation().parse(params.projectId);

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.admin])
    ) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
        "Forbidden",
      );
    }

    return await scheduleProjectDelete(projectId, {
      userId: user.id,
      displayName: user.name,
    });
  })
  .post([], async ({ user, params }) => {
    const projectId = zSimpleIdValidation().parse(params.projectId);

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.admin])
    ) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
        "Forbidden",
      );
    }

    // restore the project delete
    return await restoreProject(projectId, {
      userId: user.id,
      displayName: user.name,
    });
  });

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
        "Forbidden",
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
        "You do not have permission to update the project roles.",
      );
    }

    if (await checkProjectDeleted(projectId)) {
      throw customError(400, "Project is scheduled for deletion.");
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
      body.roles,
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
        "You do not have permission to remove users from this project.",
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
        "You do not have permission to view the project invites.",
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
        "Forbidden",
      );
    }

    if (await checkProjectDeleted(projectId)) {
      throw customError(400, "Project is scheduled for deletion.");
    }

    // check if the given email is valid
    const isEmailValid = await validateEmailAddress(body.email);
    if (!isEmailValid) {
      throw customError(400, "Invalid email address provided.");
    }

    // create the invite
    const invite = await inviteUser(
      projectId,
      body.email,
      body.roles,
      body.message,
      {
        userId: user.id,
        displayName: user.name,
      },
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
        "Forbidden",
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
