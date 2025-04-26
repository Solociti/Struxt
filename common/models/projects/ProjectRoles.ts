import { UserModelAction } from "../Model";
import { ProjectRoleTypes } from "../user/Roles";

export interface ProjectRole {
  projectId: string;
  action: string;
}

/**
 * The project membership details
 */
export interface ProjectRoleDocument {
  projectId: string;
  userId: string;

  roles: ProjectRoleTypes[];

  updated: UserModelAction;
}
