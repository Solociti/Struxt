import { join } from "node:path";
import { getMongoClient } from "server/database/mongodb";
import { execPromise } from "server/utils/execPromise";
import { mkDirRecursive } from "server/utils/mkDir";
import { getCurrentBackupDir } from "server/utils/uploadDir";
import { getDockerServices } from "../docker/getService";

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
  } = {}
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
      "MONGODB_USERNAME and MONGODB_PASSWORD environment variables must be set."
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
    0
  );

  let collectionsCompleted = 0;
  options.onProgress?.(0, collectionCount);

  for (const db of dbInfo) {
    options.log?.(
      `Backing up database: ${db.name} (${db.collectionCount} collections)`
    );

    let dbCommand = command + ` --db ${db.name}`;

    const archivePath = join(
      archiveDir,
      `${now.getHours()}-${db.name}.mongodb.gz`
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
  }
}

/**
 * Restore MongoDB from a backup.
 *
 * @param dbName When a name is provided, it will restore the specified database.
 */
export function restoreMongodb(dbName: string) {}
