import express from "express";
import { customError } from "../../../common/custom-error/custom-error.ts";
import { getTable } from "../../utils/database.ts";
import { userFromReq } from "../auth/userFromReq.ts";

export const router = express.Router();

router.get("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  const user = await userFromReq(req);
  if (!user.hasPermission(`struxt.projects.${projectId}`)) {
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

router.post("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  const user = await userFromReq(req);
  if (!user.hasPermission(`struxt.projects.${projectId}`)) {
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
});
