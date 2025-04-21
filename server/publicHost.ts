import "dotenv/config";

import express from "express";
import { registerErrorPage } from "./setup/errorPages";
import { expressSetup, setupSiteLogs } from "./setup/expressSetup";
import { getSiteDir } from "./utils/uploadDir";

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

      return {
        projectId: parts[2],
        path: parts.slice(4).join("/"),
      };
    }

    return { path };
  });

  // enable static files
  app.use("/", express.static("./client/dist"));

  const siteDir = getSiteDir("staging", "_").replace("/_/staging", "");
  app.use("/sites", express.static(siteDir));

  // register the error page
  registerErrorPage(app);

  const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close();
  });
}
