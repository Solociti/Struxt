import { Express, Request, Response } from "express";
import { knex } from "../utils/database.ts";
import { getIp } from "../utils/requests.ts";
import { rateLimit } from "./RateLimit.ts";

const leakRate = process.env.RL_LEAK_RATE
  ? parseInt(process.env.RL_LEAK_RATE)
  : 1200;
const windowSeconds = process.env.RL_WINDOW_SECONDS
  ? parseInt(process.env.RL_WINDOW_SECONDS)
  : 600;
const maxCapacity = process.env.RL_MAX_CAPACITY
  ? parseInt(process.env.RL_MAX_CAPACITY)
  : 200;

/**
 * Basic setups that happen for each express app
 *
 * @param app
 */
export async function expressSetup(app: Express) {
  // reduce fingerprinting
  app.disable("x-powered-by");
  app.set("trust proxy", true);

  // setup render engine for error pages
  app.set("view engine", "ejs");
  app.set("views", "templates/views");

  // setup the request start time
  app.use((req: Request, res: Response, next: () => void) => {
    (req as any).startTime = Date.now();
    next();
  });

  const limiter = await rateLimit({
    prefix: "rl",
    leakRate,
    windowSeconds,
    maxCapacity,
    unitCost: (req) => {
      // This detection might need to be turned off
      // for the public hosts. Should only be needed on the
      // api server to prevent abuse.
      if (req.path.startsWith("/api")) {
        return 2;
      }

      if (req.path.startsWith("/forms")) {
        return 20;
      }

      return 1;
    },
  });

  app.use(limiter);

  // setup logging
  app.use((req, res, next) => {
    const userAgent = req.headers["user-agent"];
    const slowDownMs = (req as any).rlSlowDown || 0;

    console.log(
      new Date(),
      `[${getIp(req)}]`,
      req.method,
      req.hostname,
      req.url,
      userAgent,
      slowDownMs ? `slow-down-ms: ${slowDownMs}` : ""
    );
    next();
  });

  // Setup a health check endpoint
  app.get("/hc", (req, res) => {
    res.json({
      status: "ok",
    });
  });
}

/**
 * Log the sites requests to the database
 *
 * @param app
 */
export function setupSiteLogs(
  app: Express,
  parsePath: (path: string) => { projectId?: string; path: string }
) {
  app.use((req: Request, res: Response, next: () => void) => {
    const userAgent = req.headers["user-agent"];
    const method = req.method;
    const hostname = req.hostname;
    const referrer = req.get("Referrer") || "";
    const ip = getIp(req);

    const url = req.url;
    const path = req.route ? req.route.path : req.path;
    const parsedPath = parsePath(path);

    const afterResponse = () => {
      res.removeListener("finish", afterResponse);
      res.removeListener("close", afterResponse);

      const status = res.statusCode;
      const responseTime = Date.now() - (req as any).startTime;

      knex
        .table("public_site_stats")
        .insert({
          site_id: parsedPath.projectId || 0,
          method,
          hostname,
          url,
          path: parsedPath.path,
          ip,
          user_agent: userAgent,
          referrer,
          status,
          response_time_ms: responseTime,
        })
        .catch((err) => {
          console.error("Error logging site stats", err);
        });
    };

    res.on("finish", afterResponse);
    res.on("close", afterResponse);

    next();
  });
}
