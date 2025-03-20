import { Request } from "express";
import { CurrentUserModel } from "../../../common/models/user/CurrentUserModel.ts";
import { realms } from "../../auth/keycloak.ts";
import { updateLocalUser } from "../../auth/updateLocalUser.ts";
import { getKey, setEx } from "../../database/dragonFly.ts";
import { getProjectRoles } from "./projectRoles.ts";

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
  const [roles, projectRoles] = await Promise.all([
    userId ? await getUserRoles(userId) : [],
    userId ? await getProjectRoles(userId) : [],
  ]);

  const user = new CurrentUserModel({
    id: req.user?.sub,
    name: req.user?.name,
    email: req.user?.email,
    roles,
    projectRoles,
  });

  // TODO: update the user after login instead of on every request
  updateLocalUser(user).catch(console.error);

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
