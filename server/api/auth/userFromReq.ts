import { Request } from "express";
import { CurrentUserModel } from "../../../common/models/user/CurrentUserModel.ts";
import { realms } from "../../auth/keycloak.ts";
import { getKey, setEx } from "../../database/dragonFly.ts";

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

  const userId = req.user?.sub;

  // load the roles for the user
  const roles = userId ? await getUserRoles(userId) : [];

  const user = new CurrentUserModel({
    id: req.user?.sub,
    name: req.user?.name,
    email: req.user?.email,
    roles,
  });

  req.loadedUser = user;
  return user;
}

/**
 * Get the roles for the user
 *
 * @param userId
 * @returns
 */
async function getUserRoles(userId: string) {
  const cachedRoles = await getKey(`keycloak:roles:${userId}`);

  if (cachedRoles) {
    return JSON.parse(cachedRoles);
  }

  try {
    const roles = await realms()
      .users(userId)
      .roleMappings.realm.composite.get();

    const roleNames = roles.map((role) => role.name).filter(Boolean);
    await setEx(`keycloak:roles:${userId}`, 600, JSON.stringify(roleNames));

    return roleNames as string[];
  } catch (err) {
    console.error(err);

    return [];
  }
}
