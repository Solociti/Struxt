import { Express } from "express";
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

/**
 * Basic setups that happen for each express app
 *
 * @param app
 */
export async function expressSetup(app: Express) {
  // reduce fingerprinting
  app.disable("x-powered-by");
  app.set("trust proxy", true);

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
