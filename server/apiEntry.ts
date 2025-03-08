import "dotenv/config";

import express, { NextFunction, Request, Response } from "express";
import {
  router as assetsRouter,
  staticFiles as assetStaticFiles,
} from "./api/assets/register";
import { router as userEndpoints } from "./api/auth/register";
import { userFromReq } from "./api/auth/userFromReq";
import { router as projectsRouter } from "./api/projects/register";
import { router as publishRouter } from "./api/publish/register";
import { protectEndpoint } from "./auth/protectEndpoint";
import {
  setupAuthEndpoints,
  setupAuthMiddleware,
  startAuthSetup,
} from "./auth/setupKeycloak";
import "./cron/queue";
import "./cron/worker";
import { serverAdapter } from "./database/dashboard";
import { router as formsRouter } from "./forms/register";
import { registerErrorPage } from "./setup/errorPages";
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

  await expressSetup(app);

  const authConfig = await startAuthSetup();
  await setupAuthMiddleware(app, authConfig);

  app.use(
    express.json({
      limit: "5mb",
    })
  );

  await setupAuthEndpoints(app, authConfig);

  app.use("/api", protectEndpoint([], { onFail: "json" }));

  app.get("/api", async (req: Request, res: Response) => {
    const user = await userFromReq(req);

    res.json({
      now: new Date(),
      user,
    });
  });

  app.use("/api/auth/user", userEndpoints);

  app.use("/api/assets", assetsRouter);
  app.use("/assets", assetStaticFiles);

  app.use("/api/projects", projectsRouter);
  app.use("/api/publish", publishRouter);

  app.use(formsRouter);

  // setup the admin pages. This should be moved to a separate server at some point
  app.use("/admin/queues", serverAdapter.getRouter());

  // Error handling middleware for the api
  app.use(
    "/api",
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      const statusCode = err.status || err.statusCode || 500;

      res.status(statusCode).json({
        error: {
          name: statusCode >= 500 ? "Server Error" : err.name || "Error",
          status: statusCode,
          message:
            err.message || "Something went wrong. Please try again later.",
        },
      });
    }
  );

  // register the last middleware for the app
  registerErrorPage(app);

  const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close();
  });
}
