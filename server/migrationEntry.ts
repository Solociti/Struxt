import "dotenv/config";
import { runMigrations } from "server/database/migration";

runMigrations()
  .then(() => {
    console.log("Migrations completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running migrations:", error);
    process.exit(1);
  });
