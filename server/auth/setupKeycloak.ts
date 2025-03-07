import { ConnectSessionKnexStore } from "connect-session-knex";
import { Express } from "express";
import session from "express-session";
import * as openid from "openid-client";
import passport from "passport";
import {
  Strategy,
  type StrategyOptions,
  type VerifyFunction,
} from "../../node_modules/openid-client/build/passport";
import { knex } from "../utils/database";

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
    new URL(
      "/realms/" + process.env.KEYCLOAK_REALM,
      process.env.KEYCLOAK_HOSTNAME
    ),
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
  app: Express,
  config: openid.Configuration
) {
  app.use(
    session({
      secret: process.env.PASSPORT_SESSION_SECRET || "temp",
      resave: false,
      saveUninitialized: true,
      store: store,
      cookie: {
        secure: true,
        maxAge: 1000 * 60 * 10,
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
export function setupAuthEndpoints(app: Express, config: openid.Configuration) {
  app.get("/auth/login", (req, res, next) => {
    if (!validBaseHosts.includes(req.hostname)) {
      // TODO: setup a better error page
      res.status(401).send("Invalid host");
      return;
    }

    const authRedirect = req.query?.auth_redirect?.toString() || "/";
    const url = new URL(authRedirect, `${req.protocol}://${req.hostname}`);

    if (url.hostname !== req.hostname) {
      // TODO: setup a better error page
      res.status(401).send("Invalid redirect");
      return;
    }

    passport.authenticate(req.hostname, {
      successRedirect: authRedirect,
      failureRedirect: "/auth/failed",
    })(req, res, next);
  });

  app.get("/auth/login/callback", (req, res, next) => {
    if (!validBaseHosts.includes(req.hostname)) {
      // TODO: setup a better error page
      res.status(401).send("Invalid host");
      return;
    }

    passport.authenticate(req.hostname, {
      successRedirect: "/",
      failureRedirect: "/auth/failed",
    })(req, res, next);
  });

  app.get("/auth/logout", (req, res) => {
    if (!validBaseHosts.includes(req.hostname)) {
      // TODO: setup a better error page
      res.status(401).send("Invalid host");
      return;
    }

    res.redirect(
      openid.buildEndSessionUrl(config, {
        post_logout_redirect_uri: `${req.protocol}://${req.hostname}/auth/logout/callback`,
      }).href
    );
  });

  app.get("/auth/logout/callback", (req, res, next) => {
    if (!validBaseHosts.includes(req.hostname)) {
      // TODO: setup a better error page
      res.status(401).send("Invalid host");
      return;
    }

    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/auth/failed", (req, res) => {
    // TODO: setup a better error page
    res.status(401).send("Login failed");
  });
}
