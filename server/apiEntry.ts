import "dotenv/config";

import express from "express";
import {
  router as assetsRouter,
  staticFiles as assetStaticFiles,
} from "./api/assets/register";
import { router as projectsRouter } from "./api/projects/register";
import { router as publishRouter } from "./api/publish/register";
import { expressSetup } from "./setup/expressSetup";
import { dbInit } from "./utils/database";

// run init scripts and then start the server
Promise.all([dbInit()]).then(() => {
  main();
});

async function main() {
  console.log("Starting server...");
  const app = express();
  const port = 3000;

  expressSetup(app);

  app.use(
    express.json({
      limit: "5mb",
    })
  );

  app.get("/api", (req, res) => {
    res.json({
      now: new Date(),
    });
  });

  app.use("/api/assets", assetsRouter);
  app.use("/assets", assetStaticFiles);

  app.use("/api/projects", projectsRouter);
  app.use("/api/publish", publishRouter);

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}
