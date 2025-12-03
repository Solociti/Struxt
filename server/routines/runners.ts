import { Request, Response } from "express";

/**
 * Executes a function in a separate process.
 *
 * Use this to execute all "serverless" or user routines.
 *
 * @param param0
 * @returns
 */
export async function runUnsafeFunction({
  req,
  res,
  body,
  ip,
}: {
  req: Request;
  res: Response;
  body: any;
  ip: string;
}) {
  // TODO: Implement this function
  // setup isolated-vm to run un trusted code from the request.
  // setup ways to inject our own methods to access database, or make requests to other services.
  // allow the code respond in any way, stream, json, text, etc.
  // for more info, see issue #92
}
