import { Request } from "express";

/**
 * Get the client ip from the request object
 *
 * @param req
 * @returns
 */
export function getIp(req: Request) {
  return req.ip;
}
