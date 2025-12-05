import express from "express";
import Stream from "node:stream";
import { internalErrorHandler } from "./internalExpressSetup";
import { AnyInternalRoutes } from "./internalRoutes";

/**
 * Setup a route endpoint for the internal server.
 */
export const internalRouter = express.Router();

/**
 * Setup the internal route endpoints.
 *
 * @param endpoint
 * @param handler
 */
export function setupInternalRoute<
  Route extends AnyInternalRoutes,
  Endpoint extends keyof Route = keyof Route
>(
  endpoint: Endpoint,
  handler: (
    body: Route[Endpoint] extends { request: infer R } ? R : never,
    { req, res }: { req: express.Request; res: express.Response }
  ) => Promise<Route[Endpoint] extends { response: infer R } ? R : never>
) {
  internalRouter.post(endpoint as string, async (req, res) => {
    try {
      const result = await handler(req.body, { req, res });

      if (result instanceof Stream) {
        res.setHeader("Content-Type", "application/octet-stream");
        result.pipe(res);
      } else {
        res.json(result);
      }
    } catch (err) {
      internalErrorHandler(err as Error, req, res);
    }
  });
}
