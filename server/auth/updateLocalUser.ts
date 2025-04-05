import { CurrentUserModel } from "common/models/user/CurrentUserModel";
import { knex } from "../utils/database";

/**
 * Update the user info in mariadb
 *
 * @param user
 */
export async function updateLocalUser(user: CurrentUserModel) {
  // update the user details in database
  const exists = await knex.table("users").where("uuid", user.id).first();

  if (exists) {
    await knex.table("users").where("uuid", user.id).update({
      email: user.email,
      display_name: user.name,
    });
  } else {
    await knex.table("users").insert({
      uuid: user.id,
      email: user.email,
      display_name: user.name,
    });
  }
}
