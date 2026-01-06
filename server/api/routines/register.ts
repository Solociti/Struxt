import {
  RoutinesFilesCreateApi,
  RoutinesFilesEditApi,
  RoutinesFilesListApi,
} from "common/api/routines/routines";
import { customError } from "common/custom-error/custom-error";
import { roles } from "common/models/user/Roles";
import { registerApi } from "../registerApi";
import { getRoutineList } from "./getRoutineList";
import { getRoutine } from "./getRoutine";
import { createSimpleId } from "server/utils/createId";
import { RoutineModel } from "common/models/routines/Routine";
import { saveRoutine } from "./saveRoutine";

registerApi<RoutinesFilesListApi>("/api/routines/:projectId/list").get(
  [roles.struxt.editor],
  async ({ user, params }) => {
    if (!user.hasProjectPermission(params.projectId, roles.projects.edit)) {
      throw customError(
        403,
        "You do not have permission to view this project."
      );
    }

    const list = await getRoutineList(params.projectId);

    return {
      list,
    };
  }
);

registerApi<RoutinesFilesCreateApi>(
  "/api/routines/:projectId/create-file"
).post([roles.struxt.editor], async ({ user, body, params }) => {
  if (!user.hasProjectPermission(params.projectId, roles.projects.edit)) {
    throw customError(
      403,
      "You do not have permission to create a new routine."
    );
  }

  // TODO: input validation, permissions, ensure that the filename has a extension and is unique

  // create a new uuid
  const uuid = await createSimpleId("routine");

  const routine = new RoutineModel({
    uuid,
    projectId: params.projectId,
    name: body.name,
    path: body.path,
    contents: body.contents || "",
  });

  // save the routine to database
  const result = await saveRoutine(routine);
  if (!result.success) {
    throw customError(400, "Failed to create new routine.");
  }

  return {
    success: true,
    item: routine.getListItem(),
  };
});

registerApi<RoutinesFilesEditApi>("/api/routines/:projectId/file", {
  bodySanitization: {
    "routine.contents": {
      skipSanitize: true,
    },
  },
})
  .get([roles.struxt.editor], async ({ user, params, query }) => {
    if (!user.hasProjectPermission(params.projectId, roles.projects.edit)) {
      throw customError(
        403,
        "You do not have permission to view this project."
      );
    }

    // TODO: input validation

    const routine = await getRoutine(params.projectId, query.uuid);
    if (!routine) {
      throw customError(404, "Routine not found.");
    }

    return { routine };
  })
  .post([roles.struxt.editor], async ({ user, params, body }) => {
    // TODO: input validation and only allow specific fields to be modified

    const routine = new RoutineModel(body.routine);

    routine.updated = {
      ...routine.updated,
      date: Math.floor(Date.now() / 1000),
      userId: user.id,
      displayName: user.name,
    };

    // save the routine to database
    const result = await saveRoutine(routine);
    if (!result.success) {
      throw customError(400, "Failed to save routine.");
    }

    return result;
  });
