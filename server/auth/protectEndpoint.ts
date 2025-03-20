import { NextFunction, Request, Response } from "express";
import { ErrorNames } from "../../common/custom-error/custom-error.ts";
import { PermType } from "../../common/models/user/Roles.ts";
import { userFromReq } from "../api/auth/userFromReq.ts";

export interface ProtectEndpointOptions {
  onFail: "redirect" | "json";
}

export function protectEndpoint(
  roles: PermType[],
  options: ProtectEndpointOptions = {
    onFail: "redirect",
  }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      // check if the user has the correct role
      const user = await userFromReq(req);

      if (
        user.isAuthenticated() &&
        (roles.length === 0 || user.hasPermission(roles))
      ) {
        next();
        return;
      }
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
