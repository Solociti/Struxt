import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { getMongoClient } from "server/database/mongodb";
import { execPromise } from "server/utils/execPromise";
import { mkDirRecursive } from "server/utils/mkDir";
import { shellQuote } from "server/utils/shellQuote";
import { getBackupDir, getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";
import { parseBackupFileName } from "./backupFileNames";
import { backupFileResults } from "./fileResults";

/**
 * Get information about the MongoDB databases.
 *
 * @param dbPrefix
 */
async function getDatabaseInfo(dbPrefix?: string) {
  const mongoClient = getMongoClient();

  const dbs = await mongoClient.db().admin().listDatabases();

  const list: { name: string; collectionCount: number }[] = [];

  for (const db of dbs.databases) {
    if (db.name === "admin" || db.name === "config" || db.name === "local") {
      continue;
    }

    if (dbPrefix && !db.name.startsWith(dbPrefix)) {
      continue;
    }

    const dbStats = await mongoClient.db(db.name).stats();
    list.push({
      name: db.name,
      collectionCount: dbStats.collections || 0,
    });
  }

  return list;
}

/**
 * Run backup for MongoDB.
 *
 * @param dbPrefix will run backups for all matching databases.
 */
export async function backupMongodb(
  dbPrefix?: string,
  options: {
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {},
) {
  const [mongoService] = await getDockerServices("mongo");
  if (!mongoService) {
    throw new Error("MongoDB docker service not found.");
  }

  /**
   * The docker command to run the backup.
   */
  let command = `/usr/bin/docker exec -i ${mongoService.ID} mongodump`;

  // add the database credentials
  const userName = process.env.MONGODB_USERNAME || "";
  const password = process.env.MONGODB_PASSWORD || "";
  if (!userName || !password) {
    throw new Error(
      "MONGODB_USERNAME and MONGODB_PASSWORD environment variables must be set.",
    );
  }
  command += ` -u ${userName} -p ${password} --authenticationDatabase admin`;

  // create the archive name
  const now = new Date();
  const archiveDir = getCurrentBackupDir();
  await mkDirRecursive(archiveDir);

  // get the list of databases to backup
  const dbInfo = await getDatabaseInfo(dbPrefix);
  const collectionCount = dbInfo.reduce(
    (count, db) => count + db.collectionCount,
    0,
  );

  let collectionsCompleted = 0;
  options.onProgress?.(0, collectionCount);

  /**
   * The backup file results
   */
  const results: any[] = [];

  for (const db of dbInfo) {
    options.log?.(
      `Backing up database: ${db.name} (${db.collectionCount} collections)`,
    );

    let dbCommand = command + ` --db ${db.name}`;

    const archivePath = join(
      archiveDir,
      `${now.getHours()}-${db.name}.mongodb.gz`,
    );
    dbCommand += ` --archive=${archivePath} --gzip`;

    options.log?.(dbCommand.replace(password, "*****"));

    // run the command
    await execPromise(dbCommand, {
      log: (message: string) => {
        message = message.replace("Err:", "").trim();
        options.log?.(message);

        if (message.includes("done dumping")) {
          collectionsCompleted++;
          options.onProgress?.(collectionsCompleted, collectionCount);
        }
      },
    });

    const result = await backupFileResults(archivePath);
    results.push(result);
  }

  return results;
}

/**
 * Restore MongoDB from a backup.
 *
 * Existing collections are dropped before they are restored.
 * Sessions are skipped unless `includeSessions` is set.
 *
 * @param date backup date directory. Example `5-3-2026`
 * @param hour
 * @param options
 * @param options.dbName When a name is provided, only the specified database is restored.
 * @param options.includeSessions
 */
export async function restoreMongodb(
  date: string,
  hour: number,
  options: {
    dbName?: string;
    includeSessions?: boolean;
    log?: (message: string) => void;
    onProgress?: (value: number, max: number) => void;
  } = {},
) {
  const [mongoService] = await getDockerServices("mongo");
  if (!mongoService) {
    throw new Error("MongoDB docker service not found.");
  }

  const userName = process.env.MONGODB_USERNAME || "";
  const password = process.env.MONGODB_PASSWORD || "";
  if (!userName || !password) {
    throw new Error(
      "MONGODB_USERNAME and MONGODB_PASSWORD environment variables must be set.",
    );
  }

  const backupDir = getBackupDir(date);
  const files = (await readdir(backupDir)).filter((file) => {
    const parsed = parseBackupFileName(file);
    return (
      parsed?.component === "mongo" &&
      parsed.hour === hour &&
      (!options.dbName || parsed.dbName === options.dbName)
    );
  });

  if (files.length === 0) {
    throw new Error(`No MongoDB backup found for ${date}/${hour}.`);
  }

  options.onProgress?.(0, files.length);

  for (const [index, file] of files.entries()) {
    options.log?.(`Restoring database backup: ${file}`);

    const args = [
      `/usr/bin/docker exec -i ${mongoService.ID} mongorestore`,
      `-u ${shellQuote(userName)} -p ${shellQuote(password)}`,
      "--authenticationDatabase admin",
      `--archive=${shellQuote(join(backupDir, file))} --gzip --drop`,
    ];
    if (!options.includeSessions) {
      args.push(`--nsExclude=${shellQuote("*.sessions*")}`);
    }

    const command = args.join(" ");
    options.log?.(command.replace(shellQuote(password), "*****"));

    await execPromise(command, {
      log: (message: string) => {
        options.log?.(message.replace("Err:", "").trim());
      },
    });

    options.onProgress?.(index + 1, files.length);
  }

  options.log?.("MongoDB restore completed successfully.");
}
