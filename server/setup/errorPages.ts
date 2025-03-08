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
    console.error(err.stack);
    const statusCode = err.status || err.statusCode || 500;

    res.status(statusCode).render("error", {
      statusCode: statusCode,
      title: statusCode === 500 ? "Server Error" : "Request Error",
      message: err.message || "Something went wrong. Please try again later.",
    });
  });
}
