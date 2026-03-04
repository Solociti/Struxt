import { ProjectEnvVariablesApi } from "common/api/projects/project";
import { VariableState } from "common/models/projects/Environment";
import { ProjectSecretModel } from "common/models/projects/ProjectSecret";
import { getCollection } from "server/database/mongodb";
import { createSimpleId } from "server/utils/createId";
import { getProjectData } from "../getProject";
import { saveProject } from "../saveProject";
import { removeProjectEnvSecret } from "./removeSecret";
import { updateProjectEnvSecret } from "./updateSecret";

/**
 * Applies a list of incremental changes to a project's environment variables.
 * Remove ops are keyed by UUID. Update ops handle creates, updates, and renames.
 *
 * @param projectId
 * @param changes
 */
export async function updateProjectEnvVariables(
  projectId: string,
  changes: ProjectEnvVariablesApi["PostBody"]["changes"],
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
        if (change.ephemeralPublicKeyHex && variable.value) {
          const { ephemeralPublicKeyHex } = change;
          const { value, name } = variable;
          secretOps.push(() =>
            updateProjectEnvSecret(
              projectId,
              env,
              uuid,
              name,
              ephemeralPublicKeyHex,
              value,
            ),
          );
        } else if (existing && existing.name !== variable.name) {
          const { name: newName } = variable;
          secretOps.push(async () => {
            const collection =
              await getCollection<ProjectSecretModel>("project_secrets");
            await collection.updateOne(
              { projectId, siteEnv: env, varUuid: uuid },
              { $set: { key: newName } },
            );
          });
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
