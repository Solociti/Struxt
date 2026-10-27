import {
  EnvironmentTypes,
  validEnvironments,
  VariableState,
} from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { VariableChange } from "./envVariables";

let _clientUuidCounter = 0;

/**
 * Returns a new client-side UUID for a variable not yet saved to the server.
 * The server detects `new-` prefix and assigns a real UUID on save.
 */
export function nextClientUuid(): string {
  return `new-${++_clientUuidCounter}`;
}

/**
 * Compute the list of variables that are missing but set in other environments.
 *
 * @param siteEnv
 * @param project
 * @param variables
 */
export function getMissingEnvVariables(
  siteEnv: EnvironmentTypes,
  project: ProjectDetails,
  variables: VariableState[],
) {
  return validEnvironments
    .filter((e) => e !== siteEnv)
    .flatMap((e) => project[e]?.variables || [])
    .filter((v) => !variables.some((existing) => existing.name === v.name))
    .filter(
      (v, index, self) => self.findIndex((t) => t.name === v.name) === index,
    );
}

/**
 * Check if the list of variables has any invalid entries (empty or duplicate names).
 *
 * @param variables
 * @returns
 */
export function hasInvalidEntries(variables: VariableState[]) {
  // check for duplicate or empty names
  const names = variables.map((v) => v.name.trim());
  const uniqueNames = new Set(names);

  return names.includes("") || uniqueNames.size !== names.length;
}

/**
 * Create a list of changes to send to the server.
 *
 * Matching is done by UUID — this correctly handles renames and the case
 * where a variable is renamed while a new one with the old name is added.
 *
 * @param siteEnv
 * @param originalVars
 * @param variables
 * @returns
 */
export function createChangeList(
  siteEnv: EnvironmentTypes,
  originalVars: VariableState[],
  variables: VariableState[],
): VariableChange[] {
  const changes: VariableChange[] = [];

  for (const variable of variables) {
    const name = variable.name.trim();
    if (!name) {
      continue;
    }

    const isNew = variable.uuid.startsWith("new-");

    if (isNew) {
      changes.push({ env: siteEnv, update: { ...variable, name } });
      continue;
    }

    const original = originalVars.find((v) => v.uuid === variable.uuid);

    if (original) {
      const nameChanged = name !== original.name;

      if (variable.isSecret) {
        // skip if no new secret value and no rename
        if (!variable.value && !nameChanged) {
          continue;
        }
      } else {
        // skip if value and name unchanged
        if (variable.value === original.value && !nameChanged) {
          continue;
        }
      }
    }

    changes.push({ env: siteEnv, update: { ...variable, name } });
  }

  for (const original of originalVars) {
    if (!variables.some((v) => v.uuid === original.uuid)) {
      changes.push({ env: siteEnv, remove: original.uuid });
    }
  }

  return changes;
}
