import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectSecretModel } from "common/models/projects/ProjectSecret";
import { getCollection } from "server/database/mongodb";

/**
 * Upsert a client-encrypted secret into the `project_secrets` collection.
 *
 * This will not insert or update the variable in the project's environment variable list.
 * The server never sees the plaintext — the client performs hybrid X25519 + AES-256-GCM encryption.
 *
 * @param projectId
 * @param env
 * @param varUuid Stable UUID from `VariableState.uuid`.
 * @param variableName The current variable name (key), updated on rename.
 * @param ephemeralPublicKeyHex The throwaway X25519 public key used to derive the session key during encryption.
 * @param encryptedValueHex AES-256-GCM cipher text of the secret value.
 */
export async function updateProjectEnvSecret(
  projectId: string,
  env: EnvironmentTypes,
  varUuid: string,
  variableName: string,
  ephemeralPublicKeyHex: string,
  encryptedValueHex: string,
): Promise<void> {
  const collection = await getCollection<ProjectSecretModel>("project_secrets");
  // TODO: ensure we are using the full ProjectSecretModel schema here, and not just a partial update, to avoid accidentally omitting fields on update.
  await collection.updateOne(
    { projectId, siteEnv: env, varUuid },
    { $set: { key: variableName, ephemeralPublicKeyHex, encryptedValueHex } },
    { upsert: true },
  );
}
