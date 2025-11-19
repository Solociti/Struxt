import { DataPropsOnly } from "common/models/Model";
import {
  AggregationCursor,
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
export function mongoConnectionUrl() {
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
const client = new MongoClient(mongoConnectionUrl(), {
  appName: `${process.env.CONTAINER_NAME}-${hostname()}`,
});
export const dbName = process.env.MONGODB_PREFIX || "struxt";

/**
 * The primary collection names.
 */
export type CollectionNames =
  | "ai_pilot_chats"
  | "ai_pilot_checkpoint_writes"
  | "ai_pilot_checkpoints"
  | "ai_pilot_models"
  | "ai_pilot_prompts"
  | "ai_pilot_token_wallet"
  | "ai_pilot_token_transactions"
  | "editor_snapshots"
  | "form_settings"
  | "form_submissions"
  | "id_counters"
  | "migrations"
  | "project_members_invites"
  | "project_members"
  | "projects_published"
  | "projects"
  | "users";

/**
 * Get the mongodb database
 */
export async function getDb(): Promise<Db> {
  return client.db(dbName);
}

/**
 * Get the MongoDB client instance.
 *
 * @returns
 */
export function getMongoClient(): MongoClient {
  return client;
}

/**
 * Get the collection from the database
 */
export async function getCollection<T>(
  name: CollectionNames
): Promise<Collection<DataPropsOnly<T>>> {
  // get the database
  const db = await getDb();

  // get the collection from the database
  const collection = db.collection<DataPropsOnly<T>>(name);
  return collection;
}

/**
 * Convert a cursor to an array
 *
 * @param cursor
 * @returns
 */
export async function toArray<T>(
  cursor: FindCursor<T> | AggregationCursor<T>
): Promise<T[]> {
  const results: T[] = [];
  for await (const doc of cursor) {
    results.push(doc);
  }
  return results;
}

export async function createIndex(
  name: CollectionNames,
  index: IndexSpecification,
  options: CreateIndexesOptions & { name: string },
  replaceExisting?: boolean
): Promise<string> {
  const db = await getDb();

  // check if the collection exists
  const collections = await db.collections();
  const collectionExists = collections.some((c) => c.collectionName === name);
  if (!collectionExists) {
    await db.createCollection(name);
  }

  // get the collection
  const collection = await getCollection(name);

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
