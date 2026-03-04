import {
  ProjectCreateApi,
  ProjectDetailsApi,
  ProjectEditorApi,
  ProjectEnvVariableKeysApi,
  ProjectEnvVariablesApi,
  ProjectListApi,
} from "common/api/projects/project";
import {
  ProjectRolesApi,
  ProjectRolesInviteApi,
} from "common/api/projects/projectRoles";
import { ProjectRoutinesEnvApi } from "common/api/projects/projectRoutines";
import { customError } from "common/custom-error/custom-error";
import { EditorData } from "common/models/projects/editorDataTypes";
import { validEnvironments } from "common/models/projects/Environment";
import { roles } from "common/models/user/Roles";
import { DEFAULT_MAX_FILENAME_LENGTH } from "common/path/sanitizeFilename";
import "server/api/domains/register";
import "server/api/projects/snapshots/register";
import { registerApi } from "server/api/registerApi";
import { validateUserId } from "server/auth/user/getUser";
import { validateEmailAddress } from "server/utils/validateEmailAddress";
import z from "zod";
import { createNewProject } from "./createNewProject";
import { getProjectEnvPublicKey } from "./envVariables/secretKey";
import { updateProjectEnvVariables } from "./envVariables/updateEnvVars";
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
import { deleteProjectRoutinesEnv } from "./routines/deleteEnv";
import { updateProjectRoutinesEnv } from "./routines/updateEnv";
import { saveProjectEditorData } from "./saveProject";
import { createEditorSnapshot } from "./snapshots/saveEditorSnapshot";
import { updateProjectDetails } from "./updateProjectDetails";

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

    // check validity of input shape and props with zod
    const { value, propPath } = z
      .object({
        propPath: z.enum([
          "name",
          "description",
          "featureFlags.aiPilot.enabled",
          "featureFlags.aiPilot.settings.monthlyAllowance",
          "featureFlags.routines.enabled",
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

registerApi<ProjectEnvVariablesApi>(
  "/api/projects/:projectId/env-variables",
).post([], async ({ user, params, body }) => {
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

  const envType = z.enum(validEnvironments);
  const variableSchema = z.object({
    uuid: z.string().min(5).max(64),
    name: z.string().min(1).max(128),
    value: z.string().max(2048),
    secretLength: z.number(),
    isSecret: z.boolean(),
  });
  const parsed = z
    .object({
      changes: z.array(
        z.union([
          z.object({
            env: envType,
            update: variableSchema,
            ephemeralPublicKeyHex: z.string().optional(),
          }),
          z.object({ env: envType, remove: z.string().min(1) }),
        ]),
      ),
    })
    .parse(body);

  await updateProjectEnvVariables(projectId, parsed.changes, {
    userId: user.id,
    displayName: user.name,
  });

  const details = await getProjectDetails(projectId);
  return {
    success: true,
    details,
  };
});

registerApi<ProjectEnvVariableKeysApi>(
  "/api/projects/:projectId/env-variables/public-key",
).get([], async ({ user, params, query }) => {
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

  const env = z.enum(validEnvironments).parse(query.env);
  const publicKeyHex = await getProjectEnvPublicKey(projectId, env);
  return { publicKeyHex };
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

registerApi<ProjectRoutinesEnvApi>("/api/projects/:projectId/routines/env")
  .post([], async ({ user, params, body }) => {
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
        item: z.object({
          uuid: z.string().min(1),
          files: z.array(z.string().min(1).max(DEFAULT_MAX_FILENAME_LENGTH)),
          ignore: z.array(z.string().min(1).max(DEFAULT_MAX_FILENAME_LENGTH)),
        }),
      })
      .parse(body);

    // update the project routine environments
    const details = await updateProjectRoutinesEnv(projectId, parsed.item);
    return { details };
  })
  .delete([], async ({ user, params, query }) => {
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

    const { uuid } = z
      .object({
        uuid: z.string().min(1),
      })
      .parse(query);

    // delete the routine environment
    const details = await deleteProjectRoutinesEnv(projectId, uuid);
    return { details };
  });
