import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectKeyModel } from "common/models/projects/ProjectSecret";
import {
  createCipheriv,
  createDecipheriv,
  generateKeyPair,
  randomBytes,
} from "crypto";
import { getCollection } from "server/database/mongodb";
import { promisify } from "util";

const generateKeyPairAsync = promisify(generateKeyPair);

const masterEncKey = process.env["PROJECT_SECRETS_MASTER_KEY"];

/**
 * Extracts the raw 32-byte key material from a DER-encoded key buffer.
 * X25519 SPKI/PKCS8 DER formats store the raw key as the last 32 bytes.
 *
 * @param der DER-encoded key buffer
 */
function rawKeyFromDer(der: Buffer): Buffer {
  return der.slice(-32);
}

/**
 * Encrypts a 32-byte raw private key using AES-256-GCM with the SECRETS_MASTER_KEY env var.
 * Stored format: iv (12 bytes) + authTag (16 bytes) + cipher text (32 bytes).
 *
 * @param rawPrivateKey 32-byte raw X25519 private key
 */
function encryptPrivateKey(rawPrivateKey: Buffer): string {
  if (!masterEncKey) {
    throw new Error("Missing PROJECT_SECRETS_MASTER_KEY environment variable.");
  }

  const masterKey = Buffer.from(masterEncKey, "hex");
  const iv = randomBytes(12);

  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);

  const cipherText = Buffer.concat([
    cipher.update(rawPrivateKey),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, cipherText]).toString("hex");
}

/**
 * Decrypts an AES-256-GCM encrypted private key using SECRETS_MASTER_KEY.
 *
 * @param encryptedHex Hex-encoded encrypted private key
 */
function decryptPrivateKey(encryptedHex: string): Buffer {
  if (!masterEncKey) {
    throw new Error("Missing PROJECT_SECRETS_MASTER_KEY environment variable.");
  }

  const combined = Buffer.from(encryptedHex, "hex");
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const cipherText = combined.subarray(28);

  const masterKey = Buffer.from(masterEncKey, "hex");

  const decipher = createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(cipherText), decipher.final()]);
}

/**
 * Generates a new X25519 key pair for a project environment, encrypts the private key
 * with SECRETS_MASTER_KEY, and upsert it in the `project_keys` collection.
 *
 * @param projectId
 * @param env
 */
export async function generateProjectEnvSecretKeys(
  projectId: string,
  env: EnvironmentTypes,
): Promise<{ privateKeyHex: string; publicKeyHex: string }> {
  const { publicKey: pubDer, privateKey: privDer } = await generateKeyPairAsync(
    "x25519",
    {
      publicKeyEncoding: { type: "spki", format: "der" },
      privateKeyEncoding: { type: "pkcs8", format: "der" },
    },
  );

  const rawPublicKey = rawKeyFromDer(Buffer.from(pubDer));
  const rawPrivateKey = rawKeyFromDer(Buffer.from(privDer));

  const encryptedPrivateKeyHex = encryptPrivateKey(rawPrivateKey);
  const publicKeyHex = rawPublicKey.toString("hex");

  const keyModel = new ProjectKeyModel({
    projectId,
    siteEnv: env,
    publicKeyHex,
    encryptedPrivateKeyHex,
  });

  const collection = await getCollection<ProjectKeyModel>("project_keys");
  await collection.updateOne(
    { projectId, siteEnv: env },
    { $set: keyModel },
    { upsert: true },
  );

  return { privateKeyHex: rawPrivateKey.toString("hex"), publicKeyHex };
}

/**
 * Retrieves the X25519 key pair for a project environment, generating one if it does not exist.
 * Returns the decrypted private key — for internal server use only, never sent to clients.
 *
 * @param projectId
 * @param env
 */
export async function getProjectEnvSecretKeys(
  projectId: string,
  env: EnvironmentTypes,
): Promise<{ privateKeyHex: string; publicKeyHex: string }> {
  const collection = await getCollection<ProjectKeyModel>("project_keys");
  const existing = await collection.findOne({ projectId, siteEnv: env });

  if (!existing) {
    return generateProjectEnvSecretKeys(projectId, env);
  }

  const rawPrivateKey = decryptPrivateKey(existing.encryptedPrivateKeyHex);
  return {
    privateKeyHex: rawPrivateKey.toString("hex"),
    publicKeyHex: existing.publicKeyHex,
  };
}

/**
 * Gets the public key for a project's environment variables,
 * generating a new key pair if one does not already exist.
 *
 * @param projectId
 * @param env
 * @returns
 */
export async function getProjectEnvPublicKey(
  projectId: string,
  env: EnvironmentTypes,
): Promise<string> {
  const collection = await getCollection<ProjectKeyModel>("project_keys");
  const existing = await collection.findOne({ projectId, siteEnv: env });

  if (!existing) {
    const { publicKeyHex } = await generateProjectEnvSecretKeys(projectId, env);
    return publicKeyHex;
  }

  return existing.publicKeyHex;
}
