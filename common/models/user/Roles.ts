export type RoleTypes =
  | "struxt.editor"
  | "struxt.projects"
  | "struxt.publish.staging"
  | "struxt.publish.production";

export const RolesList: RoleTypes[] = [
  "struxt.editor",
  "struxt.projects",
  "struxt.publish.staging",
  "struxt.publish.production",
];

export namespace roles {
  /**
   * Roles for the struxt editor
   */
  export namespace struxt {
    /**
     * Allows access to edit content in the Struxt editor
     */
    export const editor: RoleTypes = "struxt.editor";

    /**
     * Provides access to manage all projects.
     */
    export const projects: RoleTypes = "struxt.projects";

    /**
     * Setup publishing permissions.
     */
    export const publish: {
      /**
       * Allows publishing to staging environments.
       */
      staging: RoleTypes;
      /**
       * Allows publishing to production environments.
       */
      production: RoleTypes;
    } = {
      staging: "struxt.publish.staging",
      production: "struxt.publish.production",
    };
  }
}

export type PermType = RoleTypes | { or: PermType[] } | { and: PermType[] };

/**
 * Checks if the user has the permissions needed.
 *
 * Defaults to an OR check.
 * Add a {and: roles[]} to AND check those roles.
 * A or can be nested inside an and.
 *
 * @example
 * hasPermission(user.roles, [{
 *  and: ["struxt.editor", { or: ["struxt.publish.staging", "struxt.publish.production"]
 * }]
 * }]);
 *
 * The example requires the editor and either of the publish permissions.
 *
 * @param userRoles the list of roles the user has
 * @param permission the perms to check for
 * @returns
 */
export function hasPermission(
  userRoles: string[],
  permission: PermType
): boolean {
  if (userRoles.length === 0) {
    return false;
  }

  if (typeof permission === "string") {
    return userRoles.includes(permission);
  } else if ("or" in permission) {
    return permission.or.some((p) => hasPermission(userRoles, p));
  } else if ("and" in permission) {
    return permission.and.every((p) => hasPermission(userRoles, p));
  }

  return false;
}
