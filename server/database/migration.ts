import { readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getCollection, toArray } from "./mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  name: string;
  durationMs: number;
  date: number;
  batch: number;
}

/**
 * Get the base file name without the extension
 *
 * @param file
 * @returns
 */
function fileBaseName(file: string) {
  return basename(basename(file, ".ts"), ".js");
}

/**
 * Execute the migration up
 *
 */
async function executeUp() {
  console.log("Starting migration...");

  // get the migration collection
  const mCollection = await getCollection<Migration>("migrations");

  // get the last migration
  const completedMigrations = await toArray(
    mCollection.find(
      {},
      {
        sort: {
          date: -1,
        },
      }
    )
  );

  const batch: number =
    completedMigrations.reduce((acc, m) => {
      return Math.max(acc, m.batch);
    }, 0) + 1;

  // get the list of migration scripts
  const migrationFiles = await getMigrationFiles();

  // get the list of migration files not run yet
  const pendingMigrations = migrationFiles.filter((file) => {
    const baseName = fileBaseName(file);

    return !completedMigrations.some((m) => m.name === baseName);
  });

  // run the migration scripts
  for (const file of pendingMigrations) {
    const subDir = "./migration";
    const migration = await import(join(__dirname, subDir, file));

    const baseName = fileBaseName(file);
    console.log(`Running: ${baseName}`);

    let startTime = Date.now();

    try {
      // run the up function
      await migration.up();
    } catch (error) {
      console.error(`Error running migration ${baseName}:`, error);

      // rollback the migration
      if (migration.down) {
        console.log(`Rolling back migration: ${baseName}`);
        await migration.down();
      }
      throw error;
    }

    const duration = Date.now() - startTime;

    // save the migration in the database
    await mCollection.insertOne({
      name: baseName,
      durationMs: duration,
      date: Math.floor(Date.now() / 1000),
      batch,
    });
  }
}

/**
 * Get the list of migration files
 *
 * @returns
 */
async function getMigrationFiles() {
  const subDir = "./migration";
  const migrationDir = join(__dirname, subDir);

  const files = await readdir(migrationDir);
  const migrationFiles = files.filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js")
  );
  migrationFiles.sort();

  return migrationFiles;
}

/**
 * Run the migrations
 */
export async function runMigrations() {
  try {
    await executeUp();
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}
