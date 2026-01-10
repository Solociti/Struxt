import "dotenv/config";

import { HTTPStatus, StructuredError } from "common/custom-error/custom-error";
import { roles } from "common/models/user/Roles";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "node:http";
import {
  router as assetsRouter,
  staticFilesRouter as assetStaticFiles,
} from "server/api/assets/register";
import { userFromReq } from "server/api/auth/userFromReq";
import { protectEndpoint } from "server/auth/protectEndpoint";
import {
  setupAuthEndpoints,
  setupAuthMiddleware,
  startAuthSetup,
} from "server/auth/setupKeycloak";
import { serverAdapter } from "server/database/dashboard";
import { router as formsRouter } from "server/forms/register";
import { registerErrorPage } from "server/setup/errorPages";
import { expressSetup } from "server/setup/expressSetup";
import "server/setup/startup";
import { staticScreenshotFiles } from "./api/projects/projectScreenshots";
import { router as apiRouter } from "./api/registerApi";
import { setupWsServer } from "./ws/setupWs";

import "server/api/register";
import "server/core/cronQueue";
import "server/utils/geoLocation";

// imports for workers
import "server/api/projects/queues/projectWorker";
import "server/api/projects/snapshots/worker";
import "server/api/publish/worker";

// run init scripts and then start the server
main();

async function main() {
  console.log("Starting server...");
  const app = express();
  const server = createServer(app);
  const port = 3000;

  await expressSetup(app);

  // setup socket.io endpoints
  const io = await setupWsServer(server);

  const authConfig = await startAuthSetup();
  await setupAuthMiddleware(app, io, authConfig);

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

  app.use("/screenshots", staticScreenshotFiles);

  app.use(formsRouter); // TODO: move to the web server

  // setup the admin pages. This should be moved to a separate server at some point
  app.use(
    "/admin",
    protectEndpoint([roles.struxt.admin], {
      onFail: "redirect",
    })
  );
  app.use("/admin/queues", serverAdapter.getRouter());

  // Error handling middleware for the api
  app.use(
    "/api",
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      const statusCode = err.status || err.statusCode || 500;

      const error: StructuredError = {
        name: statusCode >= 500 ? "Server Error" : err.name || "Error",
        status: statusCode as HTTPStatus,
        message: err.message || "Something went wrong. Please try again later.",
      };

      res.status(statusCode).json({
        error,
      });
    }
  );

  // register the last middleware for the app
  registerErrorPage(app);

  server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close();
  });
}
