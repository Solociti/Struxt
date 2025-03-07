import "dotenv/config";

import express, { NextFunction, Request, Response } from "express";
import {
  router as assetsRouter,
  staticFiles as assetStaticFiles,
} from "./api/assets/register";
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

  app.set("view engine", "ejs");
  app.set("views", "./server/views");

  await setupAuthEndpoints(app, authConfig);

  app.use("/api", protectEndpoint([], { onFail: "json" }));

  app.get("/api", (req: Request, res: Response) => {
    res.json({
      now: new Date(),
      user: {
        id: req.user?.sub,
        name: req.user?.name,
        email: req.user?.email,
      },
    });
  });

  app.use("/api/assets", assetsRouter);
  app.use("/assets", assetStaticFiles);

  app.use("/api/projects", projectsRouter);
  app.use("/api/publish", publishRouter);

  app.use(formsRouter);

  // setup the admin pages. This should be moved to a separate server at some point
  app.use("/admin/queues", serverAdapter.getRouter());

  // Error handling middleware for 400-level errors
  app.use((req, res, next) => {
    res.status(404).render("error", {
      statusCode: 404,
      title: "Page Not Found",
      message: "The page you are looking for does not exist.",
    });
  });

  // Error handling middleware for 500-level errors
  app.use(
    "/api",
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      const statusCode = err.status || err.statusCode || 500;

      res.status(statusCode).json({
        error: {
          name: statusCode >= 500 ? "Server Error" : err.name || "Error",
          message:
            err.message || "Something went wrong. Please try again later.",
        },
      });
    }
  );

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    const statusCode = err.status || err.statusCode || 500;

    res.status(statusCode).render("error", {
      statusCode: statusCode,
      title: statusCode === 500 ? "Server Error" : "Request Error",
      message: err.message || "Something went wrong. Please try again later.",
    });
  });

  const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close();
  });
}
