import {
  EditorSnapshotListApi,
  EditorSnapshotRestoreApi,
} from "common/api/projects/editorSnapshots";
import { customError } from "common/custom-error/custom-error";
import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";
import { roles } from "common/models/user/Roles";
import { registerApi } from "server/api/registerApi";
import z from "zod";
import { editSnapshot } from "./editSnapshot";
import {
  getEditorSnapshot,
  getEditorSnapshotsList,
} from "./getEditorSnapshots";
import { restoreSnapshot } from "./restoreSnapshot";
import { validEventTypes } from "./snapshotUtils";

registerApi<EditorSnapshotListApi>("/api/projects/:projectId/snapshots")
  .get([roles.struxt.editor], async ({ user, params }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to view this project snapshots."
      );
    }

    // get the list of snapshots for the project
    const list = await getEditorSnapshotsList(projectId);

    return {
      list,
    };
  })
  .post([roles.struxt.editor], async ({ user, params, body }) => {
    const projectId = params.projectId;

    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to view this project snapshots."
      );
    }

    const option1 = z.object({
      key: z.string("locked.active"),
      value: z.boolean(),
    });
    const option2 = z.object({
      key: z.string("userNote"),
      value: z.string(),
    });

    const { eventType, snapshotTime, update } = z
      .object({
        snapshotTime: z.number().gt(0),
        eventType: z.enum(validEventTypes),
        update: option1.or(option2),
      })
      .parse(body);

    const snapshot = await editSnapshot(
      projectId,
      snapshotTime,
      eventType as EditorSnapshotModel["eventType"],
      update as EditorSnapshotListApi["PostBody"]["update"],
      { userId: user.id, displayName: user.name }
    );

    return {
      success: true,
      item: snapshot.getItem(),
    };
  });

registerApi<EditorSnapshotRestoreApi>(
  "/api/projects/:projectId/snapshots/restore"
).post([roles.struxt.editor], async ({ user, params, body }) => {
  const projectId = params.projectId;

  if (
    !user.hasPermission(roles.struxt.admin) &&
    !user.hasProjectPermission(projectId, [roles.projects.edit])
  ) {
    throw customError(
      403,
      "You do not have permission to view this project snapshots."
    );
  }

  const { eventType, snapshotTime } = z
    .object({
      snapshotTime: z.number().gt(0),
      eventType: z.enum(validEventTypes),
    })
    .parse(body);

  const snapshot = await getEditorSnapshot(
    projectId,
    snapshotTime,
    eventType as EditorSnapshotModel["eventType"]
  );
  if (!snapshot) {
    throw customError(404, "Snapshot not found.");
  }

  const success = await restoreSnapshot(snapshot, {
    userId: user.id,
    displayName: user.name,
  });

  return {
    success,
    item: snapshot.getItem(),
  };
});
