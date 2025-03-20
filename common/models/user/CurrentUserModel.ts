import {
  hasPermission,
  hasProjectPermission,
  PermType,
  ProjectPermType,
} from "./Roles.ts";

export class CurrentUserModel {
  public id: string = "";
  public email: string = "";

  public name: string = "Unknown";

  /**
   * The roles of the user
   */
  public roles: string[] = [];

  /**
   * The list of roles specific to projects
   */
  public projectRoles: {
    projectId: string;
    action: string;
  }[] = [];

  constructor(data?: Partial<CurrentUserModel>) {
    if (data) {
      this.assign(data);
    }
  }

  /**
   * Assign the data to the current user
   *
   * @param data
   */
  assign(data: Partial<CurrentUserModel>) {
    Object.assign(this, data);
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated() {
    return this.id !== "";
  }

  /**
   * Check if the user has the permission required
   *
   * @param permission
   * @returns
   */
  hasPermission(permission: PermType | PermType[]) {
    if (this.isAuthenticated()) {
      return hasPermission(this.roles, permission);
    }
    return false;
  }

  /**
   * Check if the user has the permission required for the project
   *
   * @param projectId
   * @param permission
   * @returns
   */
  hasProjectPermission(
    projectId: string,
    permission: ProjectPermType | ProjectPermType[]
  ) {
    return hasProjectPermission(this.projectRoles, projectId, permission);
  }
}
