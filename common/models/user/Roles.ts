export type RoleTypes =
  | "struxt.editor"
  | "struxt.ai-pilot"
  | "struxt.metrics"
  | "struxt.admin"
  | "struxt.publish.staging"
  | "struxt.publish.production";

export const RolesList: RoleTypes[] = [
  "struxt.editor",
  "struxt.metrics",
  "struxt.admin",
  "struxt.publish.staging",
  "struxt.publish.production",
];

export type ProjectRoleTypes =
  | "projects.admin"
  | "projects.edit"
  | "projects.metrics"
  | "projects.publish.staging"
  | "projects.publish.production";

export const ProjectRoleList: ProjectRoleTypes[] = [
  "projects.admin",
  "projects.edit",
  "projects.metrics",
  "projects.publish.production",
  "projects.publish.staging",
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
     * Allows access to the AI Pilot features.
     *
     * For editing projects, the user also needs the "projects.edit" role.
     */
    export const aiPilot: RoleTypes = "struxt.ai-pilot";

    /**
     * Allows access to the metrics page.
     */
    export const metrics: RoleTypes = "struxt.metrics";

    /**
     * Provides access to manage all projects.
     */
    export const admin: RoleTypes = "struxt.admin";

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

  export const projects: {
    /**
     * Allows editing the project in the struxt editor.
     */
    edit: ProjectRoleTypes;

    metrics: ProjectRoleTypes;

    /**
     * Allows managing the project.
     */
    admin: ProjectRoleTypes;

    publish: {
      /**
       * Allows publishing to staging environments.
       */
      staging: ProjectRoleTypes;
      /**
       * Allows publishing to production environments.
       */
      production: ProjectRoleTypes;
    };
  } = {
    admin: "projects.admin",
    edit: "projects.edit",
    metrics: "projects.metrics",
    publish: {
      staging: "projects.publish.staging",
      production: "projects.publish.production",
    },
  };
}

export const ProjectRoleGroups: Record<"Admin" | "Editor", ProjectRoleTypes[]> =
  {
    Admin: [
      roles.projects.admin,
      roles.projects.edit,
      roles.projects.metrics,
      roles.projects.publish.production,
      roles.projects.publish.staging,
    ],
    Editor: [
      roles.projects.edit,
      roles.projects.metrics,
      roles.projects.publish.staging,
    ],
  };

export const ProjectRoleDescriptions: Record<ProjectRoleTypes, string> = {
  "projects.admin":
    "Can manage all aspects of the project, including user management.",

  "projects.edit": "Can edit the website contents.",
  "projects.metrics": "Can view the project details.",
  "projects.publish.production": "Can publish to the production site.",
  "projects.publish.staging": "Can publish to the staging site.",
};

export type PermType = RoleTypes | { or: PermType[] } | { and: PermType[] };
export type ProjectPermType =
  | ProjectRoleTypes
  | { or: ProjectPermType[] }
  | { and: ProjectPermType[] };

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
  permission: PermType | PermType[]
): boolean {
  if (userRoles.length === 0) {
    return false;
  }

  if (Array.isArray(permission)) {
    if (permission.length === 0) {
      // just checks if the user is authenticated and has any role
      return true;
    }

    return permission.some((p) => hasPermission(userRoles, p));
  } else if (typeof permission === "string") {
    return userRoles.includes(permission);
  } else if ("or" in permission) {
    return permission.or.some((p) => hasPermission(userRoles, p));
  } else if ("and" in permission) {
    return permission.and.every((p) => hasPermission(userRoles, p));
  }

  return false;
}

/**
 * Checks if the user has access to the project and the permission needed.
 *
 *
 * @param projectRoles
 * @param projectId
 * @param permission
 * @returns
 */
export function hasProjectPermission(
  projectRoles: { projectId: string; action: string }[],
  projectId: string,
  permission: ProjectPermType | ProjectPermType[]
): boolean {
  const roles = projectRoles.filter((role) => role.projectId == projectId);

  if (roles.length === 0) {
    return false;
  }

  if (Array.isArray(permission)) {
    return permission.some((p) => hasProjectPermission(roles, projectId, p));
  } else if (typeof permission === "string") {
    return roles.some((role) => role.action === permission);
  } else if ("or" in permission) {
    return permission.or.some((p) => hasProjectPermission(roles, projectId, p));
  } else if ("and" in permission) {
    return permission.and.every((p) =>
      hasProjectPermission(roles, projectId, p)
    );
  }

  return false;
}
