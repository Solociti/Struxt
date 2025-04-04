import express from "express";
import { customError } from "../../../common/custom-error/custom-error.ts";
import { ProjectListApi } from "../../../common/models/projects/api.ts";
import { roles } from "../../../common/models/user/Roles.ts";
import { protectEndpoint } from "../../auth/protectEndpoint.ts";
import { getTable } from "../../utils/database.ts";
import { userFromReq } from "../auth/userFromReq.ts";
import { getProjectsAdmin, getProjectsForUser } from "./getProjectList.ts";
import { getProjectDetails } from "./getProjectDetails.ts";

export const router = express.Router();

router.get("/", async (req, res) => {
  const user = await userFromReq(req);

  if (!user.isAuthenticated()) {
    throw customError(
      401,
      "You must be logged in to access this resource.",
      "Unauthorized"
    );
  }

  // load the projects for an admin
  if (user.hasPermission(roles.struxt.admin)) {
    const rows = await getProjectsAdmin();

    const response: ProjectListApi = {
      list: rows,
    };

    res.json(response);
    return;
  }

  const rows: { id: string; name: string; description: string }[] =
    await getProjectsForUser(user.id);

  const response: ProjectListApi = {
    list: rows,
  };

  res.json(response);
});

router.get("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  const user = await userFromReq(req);
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

  const [row] = await getTable("sites").where({
    id: projectId,
  });

  if (!row) {
    throw customError(
      404,
      "Could not load the requested project.",
      "ProjectNotFound"
    );
  }

  res.json({ project: JSON.parse(row.project) });
});

router.post(
  "/:projectId",
  protectEndpoint(["struxt.editor"]),
  async (req, res) => {
    const projectId = req.params.projectId;

    const user = await userFromReq(req);
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

    await getTable("sites")
      .update({
        project: JSON.stringify(req.body.project),
        updated_at: new Date(),
        updated_by: user.id,
      })
      .where({
        id: projectId,
      });

    const [row] = await getTable("sites").where({
      id: projectId,
    });

    await getTable("sites_history").insert({
      ...row,
    });

    // Create a new project
    res.json({
      success: true,
    });
  }
);

router.get("/details/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  const user = await userFromReq(req);
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

  res.json({ details });
});
