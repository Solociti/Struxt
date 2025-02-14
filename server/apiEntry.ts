import express from "express";
import {
  router as assetsRouter,
  staticFiles as assetStaticFiles,
} from "./api/assets/register";
import { router as projectsRouter } from "./api/projects/register";
import { knex } from "./utils/database";

// migrate the database to latest version and then start the server
console.log("Migrating database...");
knex.migrate.latest().then(() => {
  main();
});

async function main() {
  console.log("Starting server...");
  const app = express();
  const port = 3000;

  // reduce fingerprinting
  app.disable("x-powered-by");

  app.use(express.json());

  app.get("/api", (req, res) => {
    res.json({
      now: new Date(),
    });
  });

  app.use("/api/assets", assetsRouter);
  app.use("/assets", assetStaticFiles);

  app.use("/api/projects", projectsRouter);

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}
