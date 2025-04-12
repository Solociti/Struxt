import {
  Collection,
  CreateIndexesOptions,
  Db,
  FindCursor,
  IndexSpecification,
  MongoClient,
} from "mongodb";
import { hostname } from "node:os";

/**
 * Get the mongodb connection url
 *
 * @returns
 */
function connectionUrl() {
  const urlValue = process.env.MONGODB_URI;
  if (!urlValue) {
    throw new Error("MONGODB_URI is not defined");
  }

  const url = new URL(urlValue);

  if (process.env.IS_DOCKER === "true" && url.hostname === "localhost") {
    url.hostname = "mongo";
  }

  if (process.env.MONGODB_USERNAME) {
    url.username = process.env.MONGODB_USERNAME;
  }
  if (process.env.MONGODB_PASSWORD) {
    url.password = process.env.MONGODB_PASSWORD;
  }

  return url.toString();
}

// setup the mongodb client
const client = new MongoClient(connectionUrl(), {
  appName: hostname(),
});
const dbPrefix = process.env.MONGODB_PREFIX || "struxt";

/**
 * The primary collection names.
 */
export type PrimaryCollectionName = "migrations" | "projects" | "users";

/**
 * Collection names for project specific databases
 */
export type ProjectCollectionName = "form-submissions";

export type CollectionNames = PrimaryCollectionName | ProjectCollectionName;

/**
 * Get the mongodb database
 */
// Overload signatures
export function getDb(isPrimary: true, projectId?: string): Promise<Db>;
export function getDb(isPrimary: false, projectId: string): Promise<Db>;

/**
 * Get the mongodb database
 */
export async function getDb(
  isPrimary: boolean,
  projectId?: string
): Promise<Db> {
  // If a non-primary database is requested, projectId is mandatory.
  if (!isPrimary && !projectId) {
    throw new Error("Project id is required for non-primary databases");
  }

  const dbName = isPrimary ? dbPrefix : `${dbPrefix}-${projectId}`;
  return client.db(dbName);
}

/**
 * Get the collection from the database
 */
// Overload signatures
export function getCollection(
  name: PrimaryCollectionName,
  isPrimary: true,
  projectId?: string
): Promise<Collection>;
export function getCollection(
  name: ProjectCollectionName,
  isPrimary: false,
  projectId: string
): Promise<Collection>;

/**
 * Get the collection from the database
 */
export async function getCollection(
  name: CollectionNames,
  isPrimary: boolean,
  projectId?: string
): Promise<Collection> {
  // get the database
  const db = await getDb(isPrimary as true, projectId);

  // get the collection from the database
  const collection = db.collection(name);
  return collection;
}

/**
 * Convert a cursor to an array
 *
 * @param cursor
 * @returns
 */
export async function toArray<T>(cursor: FindCursor<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const doc of cursor) {
    results.push(doc);
  }
  return results;
}

export async function createIndex(
  name: CollectionNames,
  isPrimary: boolean,
  projectId: string | undefined,
  index: IndexSpecification,
  options: CreateIndexesOptions & { name: string },
  replaceExisting?: boolean
): Promise<string> {
  const db = await getDb(isPrimary as true, projectId);

  // check if the collection exists
  const collections = await db.collections();
  const collectionExists = collections.some((c) => c.collectionName === name);
  if (!collectionExists) {
    await db.createCollection(name);
  }

  // get the collection
  const collection = await getCollection(
    name as PrimaryCollectionName,
    isPrimary as true,
    projectId as string
  );

  // check if the index already exists
  const indexes = await collection.indexes();
  const indexExists = indexes.some((i) => {
    return i.name === options.name;
  });

  if (indexExists && !replaceExisting) {
    return options.name;
  }

  // drop the index if it exists
  if (indexExists) {
    await collection.dropIndex(options.name);
  }

  // create the index
  return await collection.createIndex(index, options);
}
