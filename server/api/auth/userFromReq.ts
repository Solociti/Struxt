import { Request } from "express";
import { CurrentUserModel } from "../../../common/models/user/CurrentUserModel";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      loadedUser?: CurrentUserModel;
    }
  }
}

export async function userFromReq(req: Request) {
  if (req.loadedUser) {
    return req.loadedUser;
  }

  const user = new CurrentUserModel({
    id: req.user?.sub,
    name: req.user?.name,
    email: req.user?.email,
    roles: [],
  });

  req.loadedUser = user;
  return user;
}
