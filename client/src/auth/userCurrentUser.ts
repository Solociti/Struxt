import { useEffect, useState } from "react";
import { CurrentUserModel } from "common/models/user/CurrentUserModel";
import { PermType } from "common/models/user/Roles";
import { getCurrentUser, onUserUpdate } from "./user";

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserModel | null>(getCurrentUser());

  useEffect(() => {
    return onUserUpdate((user) => setUser(user), true);
  }, []);

  return {
    user,
    hasPermission: (permission: PermType) => {
      if (!user) {
        return false;
      }

      return user.hasPermission(permission);
    },
  };
}
