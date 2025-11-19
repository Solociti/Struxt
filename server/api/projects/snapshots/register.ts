import { EditorSnapshotListApi } from "common/api/projects/editorSnapshots";
import { customError } from "common/custom-error/custom-error";
import { roles } from "common/models/user/Roles";
import { registerApi } from "server/api/registerApi";
import { getEditorSnapshots } from "./getEditorSnapshots";

registerApi<EditorSnapshotListApi>("/api/projects/:projectId/snapshots").get(
  [roles.struxt.editor],
  async ({ user, params }) => {
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
    const list = await getEditorSnapshots(projectId);

    return {
      list,
    };
  }
);
