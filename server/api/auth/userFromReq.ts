import { CurrentUserModel } from "common/models/user/CurrentUserModel";
import express from "express";
import { getUserRoles } from "server/auth/user/getUser";
import { realms } from "../../auth/keycloak";
import { updateLocalUser } from "../../auth/updateLocalUser";
import { getKey, setEx } from "../../database/dragonFly";
import { getProjectRoles } from "./projectRoles";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      loadedUser?: CurrentUserModel;
    }
  }
}

/**
 * Get the user from the request, or load it from the database.
 *
 * This function will save the user to the request object if it's not already.
 *
 * @param req
 * @returns
 */
export async function userFromReq(req: express.Request) {
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
 * @deprecated
 *
 * @param userId
 * @returns
 */
export async function getKeyCloakUserRoles(userId: string) {
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
  } catch (err: any) {
    console.error(err.name, err.message);
    return [];
  }
}
