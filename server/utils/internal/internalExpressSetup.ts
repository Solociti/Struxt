import {
  customError,
  HTTPStatus,
  StructuredError,
} from "common/custom-error/custom-error";
import express, { Express, Request, Response } from "express";
import { getIp } from "server/utils/requests";

export const internalExpressPort = 3030;

/**
 * Setup the express app for the internal server communication channels
 *
 * @param app
 */
export async function internalExpressSetup(app: Express) {
  app.use(
    express.json({
      limit: "5mb",
    })
  );

  // setup the request start time
  app.use((req: Request, res: Response, next: () => void) => {
    (req as any).startTime = Date.now();
    next();
  });

  app.get("/hc", (req, res) => {
    res.json({
      status: "ok",
    });
  });
}

/**
 * Handles the error response for the internal server.
 *
 * @param err
 * @param req
 * @param res
 */
export function internalErrorHandler(err: Error, req: Request, res: Response) {
  const statusCode = err.status || err.statusCode || 500;

  const error: StructuredError = {
    name: statusCode >= 500 ? "Server Error" : err.name || "Error",
    status: statusCode as HTTPStatus,
    message: err.message || "Something went wrong. Please try again later.",
  };

  res.status(statusCode).json({
    error,
  });
}

/**
 * Setup the auth middleware for the internal server communication channels.
 *
 * Any endpoint downstream will be protected by this middleware.
 *
 */
export function requireInternalAuth() {
  return async (req: Request, res: Response, next: () => void) => {
    try {
      // check if the request is from a trusted source
      // perform a dns check to ensure that the request is from a trusted source
      const ip = getIp(req);
      if (!ip) {
        throw customError(403, "Request not from trusted source.");
      }

      // TODO: setup some sort of auth so if the routines server is compromised,
      // the requests can be blocked. Probably use a jwt token.
      // IP can't be used as the source always shows the host.

      next();
    } catch (err) {
      internalErrorHandler(err as Error, req, res);
    }
  };
}
