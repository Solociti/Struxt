import "dotenv/config";

import express from "express";
import { expressSetup } from "./setup/expressSetup";
import { getSiteDir } from "./utils/uploadDir";

// run init scripts and then start the server
main();

async function main() {
  console.log("Starting server...");
  const app = express();
  const port = 3000;

  expressSetup(app);

  // enable static files
  app.use("/", express.static("./dist"));

  const siteDir = getSiteDir("staging", "_").replace("/_/staging", "");
  app.use("/sites", express.static(siteDir));

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}
