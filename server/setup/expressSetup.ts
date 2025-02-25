import { Express } from "express";

/**
 * Basic setups that happen for each express app
 *
 * @param app
 */
export function expressSetup(app: Express) {
  // reduce fingerprinting
  app.disable("x-powered-by");
  // TODO: ensure that the proxy header can't be spoofed
  app.set("trust proxy", true);

  // setup logging
  app.use((req, res, next) => {
    const userAgent = req.headers["user-agent"];
    console.log(new Date(), req.method, req.url, userAgent);
    next();
  });

  // Setup a health check endpoint
  app.get("/hc", (req, res) => {
    res.json({
      status: "ok",
    });
  });
}
