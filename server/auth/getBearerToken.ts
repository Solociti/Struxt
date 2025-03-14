import * as openid from "openid-client";
import { getKey, setEx } from "../database/dragonFly.ts";
import { startAuthSetup } from "./setupKeycloak.ts";

let config: openid.Configuration;

// setup the auth config on startup
setTimeout(() => {
  startAuthSetup().then((c) => {
    config = c;
  });
}, 10 * 1000);

/**
 * Get the bearer token to use for the keycloak api calls
 *
 * @returns
 */
export async function getBearerToken() {
  // get the tokens from the database
  const cachedToken = await getKey("keycloak:api:tokens");
  if (cachedToken) {
    const data = JSON.parse(cachedToken);
    return data.access_token;
  }

  // setup the config if it is not already setup
  if (!config) {
    config = await startAuthSetup();
  }

  // get the tokens from the keycloak server
  const tokens = await openid.clientCredentialsGrant(config, {
    scope: "openid",
  });

  // save the tokens to the database
  const ttl = (tokens.expiresIn() || 300) - 10;
  await setEx("keycloak:api:tokens", ttl, JSON.stringify(tokens));

  return tokens.access_token;
}
