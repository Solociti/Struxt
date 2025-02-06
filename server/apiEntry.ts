import express from "express";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    now: new Date(),
  });
});

import {
  router as assetsRouter,
  staticFiles as assetStaticFiles,
} from "./api/assets/register";
app.use("/api/assets", assetsRouter);
app.use("/assets", assetStaticFiles);

import { router as projectsRouter } from "./api/projects/register";
app.use("/api/projects", projectsRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
