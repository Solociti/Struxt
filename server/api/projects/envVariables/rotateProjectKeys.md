# Project Key Rotation

Each `projectId + siteEnv` pair has a dedicated X25519 keypair stored in `project_keys`.
Rotating this keypair requires re-encrypting every associated secret in `project_secrets`
because they were encrypted using ECDH against the old public key.

This is scoped per project and environment, making it a good candidate for an API
endpoint in the future (e.g. `POST /api/projects/:projectId/env-variables/rotate-keys`).

## How It Works

```
project_keys  (projectId + siteEnv)
  publicKeyHex              ← used by the client to encrypt new secrets
  encryptedPrivateKeyHex    ← used by the server to decrypt secrets at deploy time

project_secrets  (projectId + siteEnv + key)
  ephemeralPublicKeyHex     ← throwaway client key used to derive the session key
  encryptedValueHex         ← AES-256-GCM ciphertext
```

Unlike master key rotation, the server must **decrypt** every existing secret during
this process (using `getProjectEnvSecret`) to re-encrypt them against the new public key.
Plaintext is held in memory only for the duration of the re-encryption and immediately
discarded.

## What Is Affected

- `project_keys` — the keypair document for the given `projectId + siteEnv`.
- `project_secrets` — every secret document for the given `projectId + siteEnv`.

No other projects or environments are affected.

Because this is scoped to a single project + environment and triggered on demand by a
project owner, no staging phase is needed. All secrets are decrypted and re-encrypted
in memory, then written in a single bulk operation.

## Rotation Steps

### 1. Trigger rotation

Call the rotation endpoint (or script) for the target `projectId + siteEnv`.

### 2. Server-side execution

1. Load the current `project_keys` document and decrypt the private key.
2. Generate a new X25519 keypair.
3. For each document in `project_secrets` for this project + env:
   - Decrypt `encryptedValueHex` using the old private key (via `getProjectEnvSecret`).
   - Generate a new server-side throwaway ephemeral X25519 keypair.
   - ECDH between the ephemeral private key and the new public key → new session key.
   - Encrypt the plaintext with the new session key.
   - Discard the plaintext and the ephemeral private key immediately.
4. Aborts on any decryption failure — the rotation is not committed if any secret cannot be read.
5. Write in a single bulk operation:
   - Update `project_keys` with the new `publicKeyHex` and `encryptedPrivateKeyHex`.
   - Update every `project_secrets` document with its new `ephemeralPublicKeyHex` and `encryptedValueHex`.

### 3. Verify

Confirm secrets are still readable by triggering a test deploy or calling
`getProjectEnvSecret` for a known key in the affected environment.

## Rollback

Since the old values are overwritten in place, rollback requires restoring `project_keys`
and `project_secrets` from a pre-rotation snapshot. Always take a MongoDB backup of both
collections before running.
