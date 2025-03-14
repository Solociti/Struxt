export class CurrentUserModel {
  public id: string = "";
  public email: string = "";

  public name: string = "Unknown";

  /**
   * The roles of the user
   */
  public roles: string[] = [];

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
   * @param role
   * @returns
   */
  hasPermission(role: string) {
    return this.isAuthenticated() && this.roles.includes(role);
  }
}
