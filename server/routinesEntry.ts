//! dot env isn't imported intentionally to avoid exposing the keys
import express from "express";
import "server/routines/queue/worker";
import {
  internalExpressPort,
  internalExpressSetup,
} from "./utils/internal/internalExpressSetup";
import { internalRouter } from "./utils/internal/setupInternalRoute";

import "server/routines/registerEndpoint";

// run init scripts and then start the server
main();

async function main() {
  console.log("Starting server...");
  const app = express();
  const port = internalExpressPort;

  await internalExpressSetup(app);

  app.use(internalRouter);

  const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close();
  });
}
