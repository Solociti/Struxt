import { customError } from "common/custom-error/custom-error";
import { NextFunction, Request, Response } from "express";
import promCl from "prom-client";
import { setupNewClient } from "../database/dragonFly";
import { getIp } from "../utils/requests";

export async function rateLimit(options: {
  prefix: string;
  leakRate: number;
  windowSeconds: number;
  maxCapacity: number;
  unitCost: (req: Request, ip: string) => number;
}) {
  // setup a metrics counter for slowed and limited requests
  const slowedRequests = new promCl.Counter({
    name: "struxt_slowed_requests",
    help: "Number of requests that were slowed down with rate limiting",
    labelNames: ["ip"],
  });
  const limitedRequests = new promCl.Counter({
    name: "struxt_limited_requests",
    help: "Number of requests that were limited with rate limiting",
    labelNames: ["ip"],
  });

  const memoryStore = new Map<string, number>();

  const intervalSec = Math.max(10, options.windowSeconds / options.leakRate);
  setInterval(() => {
    const leakRate = (options.windowSeconds / options.leakRate) * intervalSec;

    for (const key of memoryStore.keys()) {
      let count = memoryStore.get(key) as number;
      count -= leakRate;

      if (count <= 0) {
        memoryStore.delete(key);
        continue;
      }
      memoryStore.set(key, count);
    }
  }, intervalSec * 1000);

  /**
   * The redis client
   */
  const client = await setupNewClient();

  const checkLimit = async (key: string, cost: string) => {
    const [limited, limit, remaining, retryAfter, resetIn] =
      (await client.sendCommand([
        "CL.THROTTLE",
        key,
        options.maxCapacity.toString(),
        options.leakRate.toString(),
        options.windowSeconds.toString(),
        cost,
      ])) as [number, number, number, number, number];

    return {
      limited: limited === 1,
      limit,
      remaining,
      retryAfter,
      resetIn,
    };
  };

  const limit = (res: Response, next: NextFunction) => {
    if (!res.headersSent) {
      res.setHeader("X-RateLimit-Limit", options.maxCapacity.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
    }

    limitedRequests.inc({ ip: getIp(res.req) }, 1);

    const err = customError(429, "Too many requests.", "RateLimitError");
    next(err);
  };

  const slowDown = async (
    req: Request,
    res: Response,
    next: () => void,
    remaining: number,
  ) => {
    if (!res.headersSent) {
      res.setHeader("X-RateLimit-Limit", options.maxCapacity.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
    }

    const percent = remaining / options.maxCapacity;
    const delay = (0.3 - percent) * 5000;
    (req as any).rlSlowDown = delay;

    slowedRequests.inc({ ip: getIp(req) }, 1);

    setTimeout(next, delay);
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    // get the ip
    const ip = getIp(req);
    const key = `${options.prefix}:${ip}`;

    try {
      const result = await checkLimit(
        key,
        options.unitCost(req, ip || "").toString(),
      );

      // store the result for logging
      (req as any).rlResult = result;

      // rate limit the requests
      if (result.limited) {
        limit(res, next);
        return;
      }

      // if close to the rate limit, start throttling
      if (result.remaining < options.maxCapacity * 0.3) {
        slowDown(req, res, next, result.remaining);
        return;
      }
    } catch (err) {
      // continue with basic rate limit as fail safe
      console.error(err);

      let count = memoryStore.get(key) || 0;
      count += options.unitCost(req, ip || "");
      memoryStore.set(key, count);

      if (count > options.maxCapacity) {
        limit(res, next);
        return;
      }
    }

    next();
  };
}
