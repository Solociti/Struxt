import {
  errorNameFromStatus,
  HTTPStatus,
} from "common/custom-error/custom-error";
import { Express, Request, Response, NextFunction } from "express";

/**
 * This function registers the error page for the app
 *
 * This needs to be the last middleware registered in the app
 *
 * @param app
 */
export function registerErrorPage(app: Express) {
  // Error handling middleware for 404 errors
  app.use((req, res, next) => {
    res.status(404).render("error", {
      statusCode: 404,
      title: "Page Not Found",
      message: "The page you are looking for does not exist.",
    });
  });

  // Error handling middleware for general errors
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || err.statusCode || 500;

    if ([400, 401, 402, 403, 404].includes(statusCode)) {
      console.log(`[HTTP ${statusCode}]`, err.name, req.url);
    } else {
      console.error(`[HTTP ${statusCode}]`, req.url, err.stack);
    }

    res.status(statusCode).render("error", {
      statusCode: statusCode,
      title: errorNameFromStatus(statusCode as HTTPStatus, "Request Error"),
      message: err.message || "Something went wrong. Please try again later.",
    });
  });
}
