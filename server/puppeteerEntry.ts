import "dotenv/config";

import express from "express";

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

  const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close();
  });
}
