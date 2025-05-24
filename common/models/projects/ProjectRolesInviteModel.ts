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
   * The name of the project this invite is for
   */
  public projectName: string = "";

  /**
   * The email address this invite is for
   */
  public email: string = "";

  public message: string = "";

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

  public cancelled: UserModelAction = {
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

  /**
   * Checks if the invite can still be accepted
   */
  isInviteValid(): { valid: boolean; message: string } {
    if (this.accepted.active) {
      return { valid: false, message: "Invite already accepted." };
    }
    if (this.cancelled.active) {
      return { valid: false, message: "Invite is cancelled." };
    }

    if (this.expirationDate < Math.floor(Date.now() / 1000)) {
      return { valid: false, message: "Invite expired." };
    }

    return { valid: true, message: "" };
  }
}
