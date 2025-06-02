import { UserModelAction } from "../Model";
import { ProjectRoleTypes } from "../user/Roles";
import { DeepPartial, mergeDeep } from "../utils";

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

  updated: Omit<UserModelAction, "active">;
}

export interface ProjectRoleVisualDocument extends ProjectRoleDocument {
  userDisplayName: string;

  userEmail: string;
}

/**
 * Create the ProjectRoleDocument data
 *
 * @param data
 * @returns
 */
export function createProjectRoleDoc(
  data: DeepPartial<ProjectRoleDocument>
): ProjectRoleDocument {
  const doc: ProjectRoleDocument = {
    projectId: "",
    userId: "",
    roles: [],
    updated: {
      userId: "",
      displayName: "",
      date: 0,
    },
  };

  return mergeDeep(doc, data);
}
