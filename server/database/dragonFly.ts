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

export type RedisClientType = typeof keyClient;

export async function getClient() {
  if (!connected) {
    await keyClient.connect();
    connected = true;
  }

  return keyClient;
}

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

/**
 * Post a message to a channel
 *
 * @param channel
 * @param message
 * @returns
 */
export async function publishMessage(
  channel: string,
  message: string | object,
) {
  try {
    if (!connected) {
      await keyClient.connect();
      connected = true;
    }
    // check if the message is an object and stringify it
    if (typeof message === "object") {
      message = JSON.stringify(message);
    }

    // publish the message to the channel
    return await keyClient.publish(channel, message);
  } catch (error) {
    console.error("Error publishing message to channel:", error);
  }
}

export function subscribeToChannel<T = any>(
  channel: string,
  parse: true,
  callback: (message: T) => void,
): () => void;
export function subscribeToChannel(
  channel: string,
  parse: false,
  callback: (message: string) => void,
): () => void;

/**
 * Subscribe to a channel
 *
 * @param channel
 * @param callback
 * @returns
 */
export function subscribeToChannel(
  channel: string,
  parse: boolean,
  callback: (message: string) => void,
): () => void {
  let unregistered = false;
  const subscriber = keyClient.duplicate();

  const setup = async () => {
    // subscribe to the channel
    await subscriber.connect();

    await subscriber.subscribe(channel, (message) => {
      try {
        if (parse) {
          message = JSON.parse(message);
        }

        callback(message);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });
  };

  setup().catch((error) => {
    console.error("Error subscribing to channel:", error);
  });

  return () => {
    if (unregistered) {
      return;
    }

    unregistered = true;

    // unsubscribe from the channel
    subscriber.unsubscribe(channel);
    subscriber.quit();
  };
}
