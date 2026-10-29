import { NextFunction, Request, Response } from "express";

const proxyHeaders = [
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-real-ip",
  "forwarded",
  "via",
];

/**
 * Check if a request was made directly from the machine, without a proxy.
 *
 * @param remoteAddress the address of the socket
 * @param headers request headers
 * @returns
 */
export function isLocalRequest(
  remoteAddress: string | undefined,
  headers: Record<string, unknown>
) {
  const loopback =
    remoteAddress === "127.0.0.1" ||
    remoteAddress === "::1" ||
    remoteAddress === "::ffff:127.0.0.1";

  return loopback && !proxyHeaders.some((header) => header in headers);
}

/**
 * Express middleware that rejects requests that are not local or are proxied.
 *
 * @param req
 * @param res
 * @param next
 */
export function localOnly(req: Request, res: Response, next: NextFunction) {
  if (!isLocalRequest(req.socket.remoteAddress, req.headers)) {
    res.status(403).json({ error: "Only local requests are allowed." });
    return;
  }

  next();
}
