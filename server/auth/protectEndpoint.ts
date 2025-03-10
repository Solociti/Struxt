import { NextFunction, Request, Response } from "express";
import { ErrorNames } from "../../common/custom-error/custom-error.ts";

export interface ProtectEndpointOptions {
  onFail: "redirect" | "json";
}

export function protectEndpoint(
  roles: string[],
  options: ProtectEndpointOptions = {
    onFail: "redirect",
  }
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      //TODO check if the user has the correct role
      next();
      return;
    }

    if (options.onFail === "redirect") {
      const url = new URL(req.url, `${req.protocol}://${req.hostname}`);

      const redirectUrl = new URL("/auth/login", url.origin);
      redirectUrl.searchParams.set("auth_redirect", url.pathname);

      res.redirect(redirectUrl.href);
      return;
    } else {
      res.status(401).json({
        error: {
          name: ErrorNames.Unauthorized,
          status: 401,
          message: "You must be logged in to access this resource.",
        },
      });
      return;
    }
  };
}
