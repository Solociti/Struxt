import { Model, ModelAction, UserModelAction } from "../Model";
import { ProjectRoleTypes } from "../user/Roles";
import { DeepPartial, mergeDeep } from "../utils";

const defaultExpireTime = 60 * 60 * 24 * 2; // 2 days

/**
 * Used when inviting a user to a project
 */
export class ProjectRolesInviteModel extends Model {
  public inviteId: string = "";

  /**
   * the project this invite is for
   */
  public projectId: string = "";

  /**
   * The email address this invite is for
   */
  public email: string = "";

  /**
   * The roles this invite is for
   */
  public roles: ProjectRoleTypes[] = [];

  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  public accepted: UserModelAction = {
    active: false,
    date: 0,
    userId: "",
    displayName: "",
  };

  /**
   * Tells if the invite email has been sent
   */
  public emailSent: ModelAction = {
    active: false,
    date: 0,
  };

  /**
   * The time when the invite expires
   */
  public expirationDate: number =
    Math.floor(Date.now() / 1000) + defaultExpireTime;

  constructor(data?: DeepPartial<ProjectRolesInviteModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<ProjectRolesInviteModel>) {
    mergeDeep(this, data);
  }

  clone(): ProjectRolesInviteModel {
    return new ProjectRolesInviteModel(JSON.parse(JSON.stringify(this)));
  }
}
