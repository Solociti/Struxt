import express from "express";
import { getTable } from "../../utils/database";

export const router = express.Router();

router.get("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  const [row] = await getTable("sites").where({
    id: projectId,
  });

  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json({ project: JSON.parse(row.project) });
});

router.post("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  await getTable("sites")
    .update({
      project: JSON.stringify(req.body.project),
    })
    .where({
      id: projectId,
    });

  // Create a new project
  res.json({
    success: true,
  });
});
