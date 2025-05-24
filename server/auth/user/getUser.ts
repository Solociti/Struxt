import { ModelAsDocument } from "common/models/Model";
import { UserModel } from "common/models/user/UserModel";
import { getCollection } from "server/database/mongodb";

/**
 * Get the user data from database
 *
 * @param userId
 * @returns
 */
export async function getUser(userId: string) {
  const collection = await getCollection("users");

  const doc = await collection.findOne<ModelAsDocument<UserModel>>({
    id: userId,
  });

  if (!doc) {
    return null;
  }
  if (doc._id) {
    delete doc._id;
  }

  const user = new UserModel(doc);
  return user;
}

/**
 * Load the user roles from the database
 *
 * @param userId
 * @returns
 */
export async function getUserRoles(userId: string) {
  const collection = await getCollection<UserModel>("users");

  // load the roles for the user
  const doc = await collection.findOne(
    {
      id: userId,
    },
    {
      projection: {
        roles: 1,
      },
    }
  );

  if (!doc) {
    return [];
  }
  const roles = doc.roles || [];
  return roles;
}

/**
 * Check if the given user is is valid.
 *
 * @param userId
 */
export async function validateUserId(userId: string) {
  if (!userId || userId.length < 16) {
    return false;
  }

  // check if the user exists
  const collection = await getCollection<UserModel>("users");
  const doc = await collection.findOne(
    {
      id: userId,
    },
    {
      projection: { id: 1 },
    }
  );

  if (doc) {
    return true;
  }

  return false;
}

/**
 * Update the user display name in a model action
 *
 * @param action
 * @returns
 */
export async function updateModelActionUser(action: {
  userId: string;
  displayName: string;
}) {
  if (!action.userId) {
    return;
  }

  const collection = await getCollection<UserModel>("users");

  // load the roles for the user
  const doc = await collection.findOne(
    {
      id: action.userId,
    },
    {
      projection: {
        name: 1,
      },
    }
  );

  if (!doc) {
    return;
  }
  action.displayName = doc.name;
}
