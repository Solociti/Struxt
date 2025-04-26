import { UserModel } from "common/models/user/UserModel";
import { getCollection } from "server/database/mongodb";

export async function saveUser(user: UserModel) {
  const collection = await getCollection("users");

  await collection.updateOne(
    {
      id: user.id,
    },
    {
      $set: user,
    },
    {
      upsert: true,
    }
  );

  return true;
}
