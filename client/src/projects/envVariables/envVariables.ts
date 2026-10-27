import { getApi, postApi } from "client/api/api";
import {
  ProjectEnvVariableKeysApi,
  ProjectEnvVariablesApi,
} from "common/api/projects/project";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { encryptSecret } from "./encryptSecret";

/**
 * Fetches the X25519 public key for a project environment.
 *
 * @param projectId
 * @param env
 */
export async function getProjectEnvPublicKey(
  projectId: string,
  env: EnvironmentTypes,
): Promise<string> {
  const response = await getApi<ProjectEnvVariableKeysApi>(
    ["/api/projects", projectId, "env-variables/public-key"],
    { env },
  );
  return response.publicKeyHex;
}

export type VariableChange =
  ProjectEnvVariablesApi["PostBody"]["changes"][number];

/**
 * Sends environment variable changes to the server, encrypting secret values
 * client-side with the project's X25519 public key before transmission.
 *
 * @param projectId
 * @param changes
 */
export async function updateProjectEnvVariables(
  projectId: string,
  changes: ProjectEnvVariablesApi["PostBody"]["changes"],
) {
  const envsNeedingKey = new Set<EnvironmentTypes>();
  for (const change of changes) {
    if ("update" in change && change.update.isSecret && change.update.value) {
      envsNeedingKey.add(change.env);
    }
  }

  const publicKeys = new Map<EnvironmentTypes, string>();
  await Promise.all(
    Array.from(envsNeedingKey).map(async (env) => {
      const key = await getProjectEnvPublicKey(projectId, env);
      publicKeys.set(env, key);
    }),
  );

  const encryptedChanges: ProjectEnvVariablesApi["PostBody"]["changes"] =
    await Promise.all(
      changes.map(async (change) => {
        if (
          "update" in change &&
          change.update.isSecret &&
          change.update.value
        ) {
          const publicKeyHex = publicKeys.get(change.env)!;
          const { ephemeralPublicKeyHex, encryptedValueHex } =
            await encryptSecret(publicKeyHex, change.update.value);

          const secretLength = change.update.value.length;

          return {
            ...change,
            ephemeralPublicKeyHex,
            update: {
              ...change.update,
              value: encryptedValueHex,
              secretLength,
            },
          };
        }
        return change;
      }),
    );

  const response = await postApi<ProjectEnvVariablesApi>(
    ["/api/projects", projectId, "env-variables"],
    {
      changes: encryptedChanges,
    },
  );

  return response;
}
