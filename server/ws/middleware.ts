import type { NextFunction, Request, RequestHandler, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      _query: { [key: string]: string | undefined };
    }
  }
}

/**
 * Middleware that only runs for the initial handshake of a socket.io connection.
 *
 * @param middleware
 * @returns
 */
export function onlyForHandshake(middleware: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    const isHandshake = req._query.sid === undefined;
    if (isHandshake) {
      middleware(req, res, next);
    } else {
      next();
    }
  };
}
