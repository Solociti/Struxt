import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectSecretModel } from "common/models/projects/ProjectSecret";
import {
  createDecipheriv,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
} from "crypto";
import { getProjectEnvSecretKeys } from "server/api/projects/envVariables/secretKey";
import { getCollection } from "server/database/mongodb";

/**
 * Get the project environment secret model data from database.
 *
 * @param projectId
 * @param env
 * @param key
 */
export async function getProjectEnvSecret(
  projectId: string,
  env: EnvironmentTypes,
  key: string,
): Promise<ProjectSecretModel | null> {
  const collection = await getCollection<ProjectSecretModel>("project_secrets");

  const secret = await collection.findOne({ projectId, siteEnv: env, key });
  if (!secret) {
    return null;
  }

  return new ProjectSecretModel(secret);
}

/**
 * Get the project environment secret model data from database by its stable UUID.
 *
 * @param projectId
 * @param env
 * @param varUuid Stable UUID from `VariableState.uuid`.
 */
export async function getProjectEnvSecretByUuid(
  projectId: string,
  env: EnvironmentTypes,
  varUuid: string,
): Promise<ProjectSecretModel | null> {
  const collection = await getCollection<ProjectSecretModel>("project_secrets");

  const secret = await collection.findOne({ projectId, siteEnv: env, varUuid });
  if (!secret) {
    return null;
  }

  return new ProjectSecretModel(secret);
}

/**
 * Decrypts a project environment secret using the stored X25519 private key.
 *
 * @param secret
 */
export async function decryptProjectSecretValue(
  secret: ProjectSecretModel,
): Promise<string> {
  const { privateKeyHex, publicKeyHex } = await getProjectEnvSecretKeys(
    secret.projectId,
    secret.siteEnv,
  );

  const serverPrivKey = createPrivateKey({
    key: {
      kty: "OKP",
      crv: "X25519",
      d: Buffer.from(privateKeyHex, "hex").toString("base64url"),
      x: Buffer.from(publicKeyHex, "hex").toString("base64url"),
    },
    format: "jwk",
  });

  const ephemeralPubKey = createPublicKey({
    key: {
      kty: "OKP",
      crv: "X25519",
      x: Buffer.from(secret.ephemeralPublicKeyHex, "hex").toString("base64url"),
    },
    format: "jwk",
  });

  const sharedSecret = diffieHellman({
    privateKey: serverPrivKey,
    publicKey: ephemeralPubKey,
  });

  const combined = Buffer.from(secret.encryptedValueHex, "hex");
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(combined.length - 16);
  const cipherText = combined.subarray(12, combined.length - 16);

  const decipher = createDecipheriv("aes-256-gcm", sharedSecret, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(cipherText),
    decipher.final(),
  ]).toString("utf8");
}
