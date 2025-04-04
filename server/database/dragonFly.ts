import { createClient } from "redis";

export const connectionParams = {
  host: process.env.IS_DOCKER === "true" ? "dragonfly" : "localhost",
  port: 6379,
};

export const clientUrl = `redis://${connectionParams.host}:${connectionParams.port}`;

/**
 * Setup a new redis client
 *
 * @returns
 */
export async function setupNewClient() {
  const client = createClient({
    url: clientUrl,
  });

  await client.connect();

  return client;
}

// setup the client to use for dragon fly key storage
const keyClient = createClient({
  url: clientUrl,
});
let connected = false;

/**
 * Get a key value from dragonfly
 *
 * @param key
 * @returns
 */
export async function getKey(key: string): Promise<string | null> {
  try {
    if (!connected) {
      await keyClient.connect();
      connected = true;
    }

    return await keyClient.get(key);
  } catch {
    return null;
  }
}

/**
 * Save a key to dragonfly
 *
 * @param key
 * @param ttl
 * @param value
 * @returns
 */
export async function setEx(key: string, ttl: number, value: string) {
  try {
    if (!connected) {
      await keyClient.connect();
      connected = true;
    }

    return await keyClient.setEx(key, ttl, value);
  } catch {
    return null;
  }
}
