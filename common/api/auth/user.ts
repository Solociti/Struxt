import { UserModel } from "common/models/user/UserModel";
import { Api } from "../api";

export interface UserApi extends Api {
  Endpoint: "/api/auth/user";

  GetQuery: {};
  GetResponse: {
    user: UserModel;
  };
}
