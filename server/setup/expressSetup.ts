import { Express, Request, Response } from "express";
import promBundle from "express-prom-bundle";
import geoip from "geoip-lite";
import ip from "ip";
import promCl from "prom-client";
import { UAParser } from "ua-parser-js";
import { isAIBot, isBot } from "ua-parser-js/helpers";
import { getIp } from "../utils/requests";
import { rateLimit } from "./RateLimit";

const leakRate = process.env.RL_LEAK_RATE
  ? parseInt(process.env.RL_LEAK_RATE)
  : 1200;
const windowSeconds = process.env.RL_WINDOW_SECONDS
  ? parseInt(process.env.RL_WINDOW_SECONDS)
  : 600;
const maxCapacity = process.env.RL_MAX_CAPACITY
  ? parseInt(process.env.RL_MAX_CAPACITY)
  : 200;

// setup metrics
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  urlValueParser: {},
});
promCl.collectDefaultMetrics({});

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

  // Setup a health check endpoint
  // Health check is added in front of the middleware to avoid
  // spending time on rate limiting and logging
  app.get("/hc", (req, res) => {
    res.json({
      status: "ok",
    });
  });

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

  app.use(metricsMiddleware);

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
}

/**
 * Log the sites requests to the database
 *
 * @param app
 */
export function setupSiteLogs(
  app: Express,
  parsePath: (path: string) => {
    projectId?: string;
    projectEnv?: string;
    path: string;
  }
) {
  // setup metrics for the web hosts
  const requestCounter = new promCl.Counter({
    name: "struxt_site_requests",
    help: "Number of requests to the site",
    labelNames: ["project_id", "project_env", "path", "method", "status"],
  });

  const deviceCounter = new promCl.Gauge({
    name: "struxt_site_requests_devices",
    help: "Number of requests based on device information",
    labelNames: ["project_id", "project_env", "os", "browser", "client_type"],
  });

  const geolocationCounter = new promCl.Gauge({
    name: "struxt_site_requests_geolocation",
    help: "Number of requests based on geolocation",
    labelNames: ["project_id", "project_env", "country", "region", "city"],
  });

  app.use((req: Request, res: Response, next: () => void) => {
    const userAgent = req.headers["user-agent"];
    const method = req.method;
    const ipAddr = getIp(req);

    const ua = UAParser(userAgent);

    let clientType = "browser";
    if (userAgent && isBot(userAgent)) {
      clientType = "bot";
    } else if (userAgent && isAIBot(userAgent)) {
      clientType = "ai-bot";
    }
    if (ua.device && ua.device.type) {
      clientType = ua.device.type;
    }

    const path = req.route ? req.route.path : req.path;
    const parsedPath = parsePath(path);

    const afterResponse = () => {
      res.removeListener("finish", afterResponse);
      res.removeListener("close", afterResponse);

      const status = res.statusCode;

      requestCounter.inc({
        project_id: parsedPath.projectId || "",
        project_env: parsedPath.projectEnv || "",
        path: parsedPath.path,
        method,
        status: status.toString(),
      });

      deviceCounter.inc({
        project_id: parsedPath.projectId || "",
        project_env: parsedPath.projectEnv || "",
        os: ua.os.name || "unknown",
        browser: ua.browser.name || "unknown",
        client_type: clientType,
      });

      if (ipAddr) {
        const geoData = geoip.lookup(ipAddr);
        const fallback = ip.isPrivate(ipAddr) ? "local-ip" : "unknown";

        geolocationCounter.inc({
          project_id: parsedPath.projectId || "",
          project_env: parsedPath.projectEnv || "",
          country: geoData?.country || fallback,
          region: geoData?.region || fallback,
          city: geoData?.city || fallback,
        });
      }
    };

    res.on("finish", afterResponse);
    res.on("close", afterResponse);

    next();
  });
}
