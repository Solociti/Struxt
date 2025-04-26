import { CurrentUserModel } from "common/models/user/CurrentUserModel";
import { getUser } from "./user/getUser";
import { saveUser } from "./user/saveUser";

/**
 * Update the user info in mariadb
 *
 * @param user
 */
export async function updateLocalUser(user: CurrentUserModel) {
  const localUser = await getUser(user.id);

  if (!localUser) {
    return;
  }

  let updated = false;

  if (localUser.email !== user.email) {
    // update the email
    localUser.email = user.email;
    updated = true;
  }

  if (localUser.name !== user.name) {
    // update the name
    localUser.name = user.name;
    updated = true;
  }

  if (updated) {
    await saveUser(localUser);
  }
}
