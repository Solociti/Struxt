import "dotenv/config";

import express from "express";
import "server/routines/queue/worker";
import { router as registerEndpointRouter } from "server/routines/registerEndpoint";

// run init scripts and then start the server
main();

async function main() {
  console.log("Starting server...");
  const app = express();
  const port = 3000;

  app.get("/hc", (req, res) => {
    res.json({
      status: "ok",
    });
  });

  app.use(registerEndpointRouter);

  const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close();
  });
}
