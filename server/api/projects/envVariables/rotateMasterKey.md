# Master Key Rotation

The `PROJECT_SECRETS_MASTER_KEY` env var is the root of the encryption hierarchy.
It encrypts each project's X25519 private key stored in the `project_keys` collection.
The `project_secrets` collection is **not** affected by a key rotation — those documents
remain decryptable via the same X25519 keypairs once the private keys are re-encrypted.

## How It Works

```
PROJECT_SECRETS_MASTER_KEY (AES-256-GCM)
  └── encrypts ──▶ encryptedPrivateKeyHex  (project_keys collection)
                        │
                        └── ECDH ──▶ session key ──▶ decrypts secret plaintext (project_secrets)
```

Rotating the master key only requires re-wrapping every `encryptedPrivateKeyHex` in
`project_keys`. No Kubernetes secrets need to be rotated. No secrets need to be
re-entered by users. The heavy re-encryption work is done ahead of time; the actual
maintenance window is a single bulk swap.

## What Is Affected During Rotation

Only two operations depend on the master key at runtime:

- **Updating secrets** — `getProjectEnvSecretKeys` decrypts the private key to provide the public key for new encryptions.
- **Deploying routines** — `getProjectEnvSecret` decrypts the private key to reproduce the ECDH session key and decrypt secret values for K8s provisioning.

All other server operations are unaffected.

## Rotation Strategy

The expensive work (re-encrypting every private key) is done ahead of time while the
server is still running. The maintenance window is reduced to a single bulk atomic
swap — swapping `tempEncryptedPrivateKeyHex` → `encryptedPrivateKeyHex` at the same
moment the env var is updated. This keeps the cut-over window as short as possible.

`ProjectKey` stores an optional `tempEncryptedPrivateKeyHex` field used only during rotation.

## Rotation Steps

### 1. Generate a new master key

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Record the output as `NEW_MASTER_KEY`. Keep the old value as `OLD_MASTER_KEY`.

### 2. Pre-compute — while the server is running

Run a one-off script (e.g. `server/database/migration/rotateMasterKey.ts`) in
**prepare** mode with both keys available:

1. Reads `OLD_MASTER_KEY` and `NEW_MASTER_KEY` from environment variables.
2. Iterates over every document in the `project_keys` collection.
3. For each document:
   - Decrypts `encryptedPrivateKeyHex` using the old key.
   - Re-encrypts the raw private key bytes with the new key and a fresh `iv`.
   - Writes the result to `tempEncryptedPrivateKeyHex` (does **not** touch `encryptedPrivateKeyHex`).
4. Aborts on any decryption failure — the run can be retried safely.

The server continues operating normally with the old key throughout this step.
Any documents written after this step starts (new projects, new key pairs) will not yet
have a `tempEncryptedPrivateKeyHex` — re-run the script before the cut-over to catch them.

### 3. Cut-over — short maintenance window

Stop only the operations that use the master key (secret updates and routine deploys) or
take the server down briefly. Then run the same script in **commit** mode:

1. For every document where `tempEncryptedPrivateKeyHex` exists:
   - Copy `tempEncryptedPrivateKeyHex` → `encryptedPrivateKeyHex`.
   - Unset `tempEncryptedPrivateKeyHex`.
   - This is done as a single bulk write operation.
2. Update `PROJECT_SECRETS_MASTER_KEY` in `.env` to `NEW_MASTER_KEY`.
3. Restart the server.

### 4. Verify

Confirm secrets can still be decrypted by triggering a test deploy or calling
`getProjectEnvSecretKeys` for a known project/env pair.

### 5. Discard the old key

Once the server is confirmed healthy, securely delete the old key value from any
temporary storage (notes, clipboard, shell history).

## Rollback

**Before commit (during pre-compute):** Simply discard `tempEncryptedPrivateKeyHex`
fields with a `$unset` bulk write and keep using `OLD_MASTER_KEY`. No data loss.

**After commit but before restart:** Reinstating a backup is the only safe path.
Always take a MongoDB snapshot of `project_keys` before starting the cut-over step.
