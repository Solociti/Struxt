import { customError, ErrorNames } from "common/custom-error/custom-error";
import { ConnectSessionKnexStore } from "connect-session-knex";
import e from "express";
import session from "express-session";
import * as openid from "openid-client";
import passport from "passport";
import {
  Strategy,
  type StrategyOptions,
  type VerifyFunction,
} from "../../node_modules/openid-client/build/passport";
import { knex } from "../utils/database";

export const keycloakRealmName = process.env.KEYCLOAK_REALM;
export const keycloakHostname = process.env.KEYCLOAK_HOSTNAME;

// setup the express session storage
const store = new ConnectSessionKnexStore({
  knex: knex,
  cleanupInterval: 1000 * 60 * 30,
});

declare global {
  namespace Express {
    interface User {
      exp: number;
      iat: number;
      auth_time: number;
      jti: string;
      iss: string;
      aud: string;
      sub: string;
      typ: string;
      azp: string;
      sid: string;
      at_hash: string;
      acr: string;
      email_verified: boolean;
      name: string;
      preferred_username: string;
      given_name: string;
      family_name: string;
      email: string;
    }
  }
}

const validHosts = process.env.AUTH_VALID_HOSTS?.split(",") || [];
const validBaseHosts = validHosts.map((host) => new URL(host).hostname);

/**
 * Get the openid configuration from the keycloak server
 *
 * @returns
 */
export async function startAuthSetup() {
  // get the openid config from the keycloak server
  const config = await openid.discovery(
    new URL("/realms/" + keycloakRealmName, keycloakHostname),
    process.env.KEYCLOAK_CLIENT_ID as string,
    process.env.KEYCLOAK_CLIENT_SECRET
  );

  return config;
}

/**
 * Setup the authentication middleware for the app
 *
 * @param app
 */
export async function setupAuthMiddleware(
  app: e.Express,
  config: openid.Configuration
) {
  app.use(
    session({
      secret: process.env.PASSPORT_SESSION_SECRET || "temp",
      resave: false,
      saveUninitialized: true,
      store: store,
      cookie: {
        // TODO: setup cert for local dev and allow https
        secure: process.env.NODE_ENV === "production" ? true : "auto",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.authenticate("session"));

  for (const host of validHosts) {
    const url = new URL("/auth/login/callback", host);

    // setup the options for the passport strategy
    const options: StrategyOptions = {
      config,
      scope: "openid email profile",
      callbackURL: url.href,
    };

    // verify the user and pass it to the next middleware
    const verify: VerifyFunction = (tokens, verified) => {
      verified(null, tokens.claims() as any);
    };

    passport.use(url.hostname, new Strategy(options, verify));
  }

  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user as any);
  });
}

/**
 * Setup the authentication endpoints for the app
 *
 * @param app
 * @param config
 */
export function setupAuthEndpoints(
  app: e.Express,
  config: openid.Configuration
) {
  app.get("/auth/login", (req, res, next) => {
    if (!validBaseHosts.includes(req.hostname)) {
      throw customError(401, "Invalid hostname.");
    }

    const authRedirect = req.query?.auth_redirect?.toString() || "/";
    const url = new URL(authRedirect, `${req.protocol}://${req.hostname}`);

    if (url.hostname !== req.hostname) {
      throw customError(401, "Invalid redirect URL.");
    }

    passport.authenticate(req.hostname, {
      successRedirect: authRedirect,
      failureRedirect: "/auth/failed",
    })(req, res, next);
  });

  app.get("/auth/login/callback", (req, res, next) => {
    if (!validBaseHosts.includes(req.hostname)) {
      throw customError(401, "Invalid hostname.");
    }

    passport.authenticate(req.hostname, {
      successRedirect: "/dashboard/",
      failureRedirect: "/auth/failed",
    })(req, res, next);
  });

  app.get("/auth/logout", (req, res) => {
    if (!validBaseHosts.includes(req.hostname)) {
      throw customError(401, "Invalid hostname.");
    }

    res.redirect(
      openid.buildEndSessionUrl(config, {
        post_logout_redirect_uri: `${req.protocol}://${req.hostname}/auth/logout/callback`,
      }).href
    );
  });

  app.get("/auth/logout/callback", (req, res, next) => {
    if (!validBaseHosts.includes(req.hostname)) {
      throw customError(401, "Invalid hostname.");
    }

    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/auth/failed", (req, res) => {
    res.status(401).render("error", {
      statusCode: 401,
      title: ErrorNames.AuthFailed,
      message:
        "Something went wrong while authenticating. Please try again momentarily.",
    });
  });
}
