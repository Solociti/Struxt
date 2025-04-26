import { Model, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "common/models/utils";

export class UserModel extends Model {
  /**
   * The user id, from keycloak
   */
  public id: string = "";

  /**
   * The user email
   */
  public email: string = "";

  /**
   * The display name for the user
   */
  public name: string = "";

  /**
   * The list of roles for the user
   */
  public roles: string[] = [];

  // setup the dates
  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  public updated: Omit<UserModelAction, "active"> = {
    date: 0,
    userId: "",
    displayName: "",
  };

  constructor(data?: DeepPartial<UserModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<UserModel>) {
    if (data.roles) {
      this.roles = data.roles as string[];
    }

    mergeDeep(this, data);
  }

  clone(): UserModel {
    const data = JSON.parse(JSON.stringify(this));
    return new UserModel(data);
  }
}
