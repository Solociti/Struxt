import "dotenv/config";

import express, { NextFunction, Request, Response } from "express";
import {
  router as assetsRouter,
  staticFiles as assetStaticFiles,
} from "server/api/assets/register";
import { userFromReq } from "server/api/auth/userFromReq";
import { protectEndpoint } from "server/auth/protectEndpoint";
import {
  setupAuthEndpoints,
  setupAuthMiddleware,
  startAuthSetup,
} from "server/auth/setupKeycloak";
import "server/cron/queue";
import "server/cron/worker";
import { serverAdapter } from "server/database/dashboard";
import { router as formsRouter } from "server/forms/register";
import { registerErrorPage } from "server/setup/errorPages";
import { expressSetup } from "server/setup/expressSetup";
import "server/setup/startup";
import { dbInit } from "server/utils/database";
import { router as apiRouter } from "./api/registerApi";

import "server/api/register";
import "server/utils/geoLocation";

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

  // register the api endpoints
  app.use(apiRouter);

  app.use("/api/assets", assetsRouter);
  app.use("/assets", assetStaticFiles);

  app.use(formsRouter); // TODO: move to the web server

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
