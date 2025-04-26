import { UserApi } from "common/api/auth/user";
import { registerApi } from "../registerApi";

registerApi<UserApi>("/api/auth/user").get([], async ({ user }) => {
  // send the user information back to the client
  return { user };
});
