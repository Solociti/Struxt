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
