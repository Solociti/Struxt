import "dotenv/config";

import express from "express";
import { registerErrorPage } from "./setup/errorPages";
import { expressSetup, setupSiteLogs } from "./setup/expressSetup";
import { sitesRouter } from "./static-host/setupSites";

import "server/utils/geoLocation";

// run init scripts and then start the server
main();

async function main() {
  console.log("Starting server...");
  const app = express();
  const port = 3000;

  await expressSetup(app);

  setupSiteLogs(app, (path) => {
    if (path.startsWith("/sites/")) {
      // remove the /sites/:projectId/:env from the path
      const parts = path.split("/");

      if (parts[3] === "staging" || parts[3] === "production") {
        return {
          projectId: parts[2],
          projectEnv: parts[3],
          publishId: parts[4],
          path: parts.slice(5).join("/"),
        };
      }

      return {
        projectId: parts[2],
        projectEnv: parts[3],
        path: parts.slice(4).join("/"),
      };
    }

    return { path };
  });

  // enable static files
  app.use("/", express.static("./client/dist"));

  app.use(sitesRouter);

  // register the error page
  registerErrorPage(app);

  const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close();
  });
}
