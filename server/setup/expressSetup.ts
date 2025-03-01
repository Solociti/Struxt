import { Express } from "express";
import { getIp } from "../utils/requests";
import { rateLimit } from "./RateLimit";

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
    leakRate: 300,
    windowSeconds: 600,
    maxCapacity: 100,
    unitCost: (req) => {
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
    console.log(new Date(), `[${getIp(req)}]`, req.method, req.url, userAgent);
    next();
  });

  // Setup a health check endpoint
  app.get("/hc", (req, res) => {
    res.json({
      status: "ok",
    });
  });
}
