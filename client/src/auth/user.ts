import { UserApi } from "common/api/auth/user";
import { CurrentUserModel } from "common/models/user/CurrentUserModel";
import { getApi } from "../api/api";

/**
 * The currently signed in user
 */
let currentUser = new CurrentUserModel();

let loadStarted = false;

/**
 * This function does not load the user from server.
 * Only returns the cached user.
 *
 * ! Do not cache the user elsewhere.
 * ! Always use this function to get the user.
 *
 * @returns
 */
export function getCurrentUser() {
  return currentUser;
}

type UserUpdateCallback = (user: CurrentUserModel) => void;

const cbList: UserUpdateCallback[] = [];
/**
 * Listen for state changes to the logged in user
 *
 * @param callback
 * @param immediate when true, the callback is called immediately with the current user
 * @returns
 */
export function onUserUpdate(callback: UserUpdateCallback, immediate = false) {
  if (!loadStarted) {
    loadCurrentUser();
  }

  if (immediate) {
    callback(currentUser);
  }

  cbList.push(callback);

  return () => {
    const index = cbList.indexOf(callback);
    if (index >= 0) {
      cbList.splice(index, 1);
    }
  };
}

let timeout: any = null;
/**
 * Notify all listeners that the user has been updated
 */
function notifyUserUpdate() {
  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(() => {
    for (const cb of cbList) {
      try {
        cb(currentUser);
      } catch {
        // no-op.
        // The callback needs to handle errors with a try/catch block itself
      }
    }
  }, 1);
}

/**
 * Load the current user from server
 *
 * @returns
 */
export async function loadCurrentUser() {
  try {
    loadStarted = true;

    const response = await getApi<UserApi>(`/api/auth/user`);

    const user = new CurrentUserModel(response.user);
    currentUser = user;
    notifyUserUpdate();

    return currentUser;
  } catch (error) {
    if (error instanceof Error && error.name === "Unauthorized") {
      currentUser = new CurrentUserModel();
      notifyUserUpdate();
    }

    throw error;
  }
}
