import { ProjectEnvVariablesApi } from "common/api/projects/project";
import { VariableState } from "common/models/projects/Environment";
import { ProjectSecretModel } from "common/models/projects/ProjectSecret";
import { createSimpleId } from "server/utils/createId";
import { getProjectData } from "../getProject";
import { saveProject } from "../saveProject";
import { getProjectEnvSecretByUuid } from "./getSecret";
import { removeProjectEnvSecret } from "./removeSecret";
import { updateProjectEnvSecret } from "./updateSecret";

/**
 * Applies a list of incremental changes to a project's environment variables.
 * Remove ops are keyed by UUID. Update ops handle creates, updates, and renames.
 *
 * @param projectId
 * @param changes
 * @param user
 */
export async function updateProjectEnvVariables(
  projectId: string,
  changes: ProjectEnvVariablesApi["PostBody"]["changes"],
  user: { userId: string; displayName: string },
) {
  const project = await getProjectData(projectId);
  const secretOps: (() => Promise<unknown>)[] = [];

  for (const change of changes) {
    const { env } = change;
    const variables = project[env].variables;

    if ("remove" in change) {
      const existing = variables.find((v) => v.uuid === change.remove);
      if (existing) {
        project[env].variables = variables.filter(
          (v) => v.uuid !== change.remove,
        );

        const { uuid: removedUuid } = existing;
        secretOps.push(() =>
          removeProjectEnvSecret(projectId, env, removedUuid),
        );
      }
    } else {
      const { update: variable } = change;

      const isNew = variable.uuid.startsWith("new-");
      const uuid = isNew ? await createSimpleId("env_variable") : variable.uuid;

      const existingIdx = variables.findIndex((v) => v.uuid === variable.uuid);
      const existing = existingIdx !== -1 ? variables[existingIdx] : null;

      if (variable.isSecret) {
        // attempt the load an existing secret
        let secretModel = isNew
          ? null
          : await getProjectEnvSecretByUuid(projectId, env, variable.uuid);

        if (!secretModel) {
          secretModel = new ProjectSecretModel({
            projectId,
            siteEnv: env,
            varUuid: uuid,
            key: variable.name,
            created: {
              ...user,
            },
          });
        }

        // mark the variable updated details
        secretModel.updated = {
          ...secretModel.updated,
          ...user,
          date: Math.floor(Date.now() / 1000),
        };
        let changed = false;

        if (change.ephemeralPublicKeyHex && variable.value) {
          const { ephemeralPublicKeyHex } = change;

          secretModel.ephemeralPublicKeyHex = ephemeralPublicKeyHex;
          secretModel.encryptedValueHex = variable.value;
          changed = true;
        }

        if (existing && existing.name !== variable.name) {
          const { name: newName } = variable;
          secretModel.key = newName;
          changed = true;
        }

        const placeholder: VariableState = {
          uuid,
          name: variable.name,
          value: "",
          secretLength: variable.secretLength,
          isSecret: true,
        };

        if (existing) {
          variables[existingIdx] = placeholder;
        } else {
          variables.push(placeholder);
        }

        if (changed) {
          secretOps.push(() => updateProjectEnvSecret(secretModel));
        }
      } else {
        const stored: VariableState = { ...variable, uuid };

        if (existing) {
          variables[existingIdx] = stored;
        } else {
          variables.push(stored);
        }
      }
    }
  }

  const result = await saveProject(project);
  await Promise.all(secretOps.map((op) => op()));
  return result;
}
