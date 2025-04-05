import { Request, Response } from "express";
import { setupNewClient } from "../database/dragonFly";
import { getIp } from "../utils/requests";

export async function rateLimit(options: {
  prefix: string;
  leakRate: number;
  windowSeconds: number;
  maxCapacity: number;
  unitCost: (req: Request, ip: string) => number;
}) {
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

  const limit = async (res: Response) => {
    if (!res.headersSent) {
      res.setHeader("X-RateLimit-Limit", options.maxCapacity.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
    }

    res.status(429).send("Too many requests");
  };

  const slowDown = async (
    req: Request,
    res: Response,
    next: () => void,
    remaining: number
  ) => {
    if (!res.headersSent) {
      res.setHeader("X-RateLimit-Limit", options.maxCapacity.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
    }

    const percent = remaining / options.maxCapacity;
    const delay = (0.3 - percent) * 5000;
    (req as any).rlSlowDown = delay;

    setTimeout(next, delay);
  };

  return async (req: Request, res: Response, next: () => void) => {
    // get the ip
    const ip = getIp(req);
    const key = `${options.prefix}:${ip}`;

    try {
      const result = await checkLimit(
        key,
        options.unitCost(req, ip || "").toString()
      );

      // store the result for logging
      (req as any).rlResult = result;

      // rate limit the requests
      if (result.limited) {
        limit(res);
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
        limit(res);
        return;
      }
    }

    next();
  };
}
