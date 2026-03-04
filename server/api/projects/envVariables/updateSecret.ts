import { ProjectSecretModel } from "common/models/projects/ProjectSecret";
import { getCollection } from "server/database/mongodb";

/**
 * Upsert a client-encrypted secret into the `project_secrets` collection.
 *
 * This will not insert or update the variable in the project's environment variable list.
 * The server never sees the plaintext — the client performs hybrid X25519 + AES-256-GCM encryption.
 *
 * @param secret
 */
export async function updateProjectEnvSecret(
  secret: ProjectSecretModel,
): Promise<void> {
  const collection = await getCollection<ProjectSecretModel>("project_secrets");

  await collection.updateOne(
    {
      projectId: secret.projectId,
      siteEnv: secret.siteEnv,
      varUuid: secret.varUuid,
    },
    { $set: secret },
    { upsert: true },
  );
}
