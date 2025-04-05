import express from "express";

/**
 * Get the client ip from the request object
 *
 * @param req
 * @returns
 */
export function getIp(req: express.Request) {
  return req.ip;
}
