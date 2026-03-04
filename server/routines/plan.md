# Routines Implementation Plan

This document outlines the architecture and implementation strategy for executing user-created project code (Routines) within the Struxt ecosystem using **Fission** on a **K3s** cluster.

## 1. Project Overview & Goals

The goal is to provide a serverless environment where users can write JavaScript/Node.js routines that are:

- **Scalable**: Automatically scale based on demand.
- **Isolated**: Securely sandboxed from the main Struxt management platform.
- **Accessible**: Reachable via unique URLs (e.g., `https://{domain}/routines/{path}`).

## 2. Infrastructure Architecture

- **Host Isolation**: Fission/K3s runs on a separate host/cluster from the main Dashboard.
- **Networking**: Secure communication between the Dashboard host and the Serverless host via **Wireguard**. (`10.30.1.1`)
- **Execution Model**:
  - **Background Jobs**: Tasks such as zipping code, deploying to Fission, and provisioning databases are handled by the **`editor-api`** service (utilizing BullMQ). The legacy `function-runner` service is removed.
  - **Free Tier**: Scale-to-zero (New-Deploy) for cost efficiency (~500ms - 2s cold start, 250 executions per month).
  - **Pro Tier**: Pre-warmed containers (Pool Manager) for low latency (<100ms execution start). $15/mo base fee includes 250,000 executions and 50 Compute Hours. Overage billed at $1 per 25,000 executions + $0.20 per additional Compute Hour.

## 3. Core Components

### 3.1. The Dashboard Editor

- **Features**: Web-based code editor with support for multiple entry points (e.g., `cron.js`, `api.js`).
- **Code Syntax Validation**: Implement a pre-save/pre-publish check (client and server-side) to ensure code is syntactically valid before it can be deployed to Fission.
- **Dependency Management**: Users define a `package.json`. The system generates this file during the publishing phase.
- **Secret UI**: A dedicated UI in the **Assets Tab** for managing environment-specific variables (**Dev**, **Staging**, **Prod**). Values are stored encrypted in MongoDB and provisioned as K8s Secrets. Keys are visible; values are "write-once" or hidden after saving.
- **Engine Requirements**: Projects must specify engine requirements (e.g., Node.js version). The build process validates these against supported Fission environment images.

### 3.2. Fission Runtime Environments

Fission environments are **pre-created on the K3s cluster by a Struxt admin** (e.g. `fission env create --name node-22 --image ghcr.io/fission/node-env-22 --builder ghcr.io/fission/node-builder-22`). Struxt does not manage their lifecycle — it only references them by name when creating packages and functions.

A Struxt-side registry (MongoDB collection `fission_environments`) tracks the environments available for use:

| Field         | Description                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `name`        | Exact Fission environment name (e.g. `node-22`). Used directly in `--env` flag.                           |
| `displayName` | Display name shown in the UI (e.g. `Node.js 22`).                                                         |
| `runtime`     | Language identifier (e.g. `nodejs`).                                                                      |
| `files`       | Default patterns that determine which files are included in the zip (e.g. `["**/*.js", "package.json"]`). |
| `isDefault`   | Boolean. Only one environment per runtime may be the default.                                             |

**Multiple Node versions** (e.g. `node-lts`, `node-22`) may exist as separate registry entries, but only one may be marked `isDefault` per runtime. The default is pre-selected when a user creates a project.

#### Project Environment Configuration

Projects store an `environments` array — they can target **one environment per runtime** (e.g. both `node-22` and `python-env` if the project supports multiple languages). **Only one environment per runtime is permitted.** Each entry supports **per-project overrides** of the environment defaults:

```jsonc
// Stored on the project document
"environments": [
  {
    "name": "node-22",          // references fission_environments.name
    "files": ["src/**/*.js", "package.json"] // overrides environment default; omit to use default
  }
]
```

- If `files` is omitted in the project entry, the environment's default globs are used.
- Overrides are **merged at deploy time** — the project value fully replaces the environment default for that field (no deep merge).
- The UI exposes overrides as an "advanced" option; most projects use the environment defaults.

### 3.3. `routines/zip`

A utility in the `editor-api` that packages the project's source code for Fission.

- **Scope**: Files are selected using the **resolved `files`** globs for the target environment (environment default, overridden by any project-level value).
- **Constraints**: Maximum archive size of **50MB**. If the size is exceeded, the upload is rejected with a descriptive error.
- **Filtering**: Skips non-text files (images, binaries) based on `common/path/FileExtensions.ts`.
- **Validation**: Performs linting to detect forbidden imports (e.g., `child_process`) and blacklisted NPM modules before upload.

### 3.4. Multi-tenant Database & Secret Provisioning

- **Database**: `editor-api` programmatically provisions dedicated MongoDB databases/users per project.
- **K8s Secrets**: Credentials and user secrets are injected into Fission functions via Kubernetes Secrets.

#### Secret Encryption Scheme

Secrets use an **envelope encryption** model with hybrid X25519 + AES-256-GCM. Plaintext values are never persisted anywhere — not in MongoDB, not in logs, not on the project document.

**Key hierarchy:**

```
SECRETS_MASTER_KEY (env var, AES-256-GCM)
  └── encrypts ──▶ project private key  (stored in `project_keys` collection)
                        │
                        └── ECDH ──▶ decrypts AES-256 session key
                                           │
                                           └── decrypts ──▶ secret plaintext
```

**Per-project keypair (generated once at project creation or first secret save):**

- An **X25519 keypair** is generated for each project.
- The **public key** is stored on the `ProjectModel` (safe to expose to clients — it can only encrypt).
- The **private key** is AES-256-GCM encrypted with `SECRETS_MASTER_KEY` and stored in a dedicated `project_keys` collection. It is **never returned by any API**.

**Saving a secret (client-side hybrid encryption):**

1. Client fetches the project public key.
2. Client generates a **throwaway ephemeral X25519 keypair** in-browser (`SubtleCrypto`).
3. ECDH key agreement between the ephemeral private key and the project public key produces a **shared AES-256-GCM session key**.
4. The secret value is encrypted with the session key.
5. The **ephemeral public key** + **encrypted value** are sent to the server and stored in the `project_secrets` collection. The ephemeral private key is discarded immediately.
6. The server never sees the plaintext.

**Decryption (only at Fission deploy time):**

1. Load the encrypted project private key from `project_keys`.
2. Decrypt it in-memory using `SECRETS_MASTER_KEY`.
3. For each secret: ECDH between the project private key and the stored ephemeral public key reproduces the session key → decrypt the value.
4. Write plaintext values to a K8s Secret.
5. Plaintext is discarded when the deploy job completes — never written to disk or logs.

**Collections:**

**`project_keys`** — one document per `projectId + siteEnv`. No public API.

- `projectId` — the project this keypair belongs to.
- `siteEnv` — `"staging"` or `"production"`.
- `publicKeyHex` — X25519 public key. Safe to expose to clients.
- `encryptedPrivateKeyHex` — X25519 private key encrypted with `SECRETS_MASTER_KEY`. Never returned by any API.

> `getProjectSecretKey` or `getProjectPublicKey` will generate keys if they don't exist for the `projectId` and `siteEnv` combo

**`project_secrets`** — one document per `projectId + siteEnv + key`. Secret values never returned by any API.

- `projectId` — the project this secret belongs to.
- `siteEnv` — `"staging"` or `"production"`.
- `key` — the env var name (e.g. `DATABASE_URL`). Visible in UI.
- `ephemeralPublicKeyHex` — the throwaway X25519 public key used during encryption. Required to reproduce the session key at decrypt time.
- `encryptedValueHex` — AES-256-GCM ciphertext of the secret value. Never returned by any API.

> `getSecrets` will not decrypt the values. Add a separate `decryptSecrets` method that'll decrypt the values.

The resulting K8s Secret (one per `projectId + siteEnv`) is shared by all Fission functions deployed under that project env, regardless of which Fission runtime environment they use.

**RBAC:** The Fission service account role (`struxt-fission-role.yaml`) must include `secrets` CRUD in the `default` namespace so the deploy job can create/update the K8s Secret that Fission mounts into the function pod.

### 3.5. Routing & Proxying

- **Nginx Integration**: The `updateProxy.ts` logic adds `/routines/` location blocks only when routines are published.
- **Transparency**: Nginx acts as a transparent proxy. Authentication/Authorization is handled by the user's routine code.
- **Web Host**: The routing is handled from the web host docker container, not the `editor-api`.
- **Payload Constraints**: Enforce default/configurable max header sizes and body sizes (e.g., 10MB) at the proxy level.

### 3.6. Routines Standard Library

To simplify development, Struxt provides a pre-bundled "Standard Library" in the environment image:

- **`Struxt.db`**: Abstracted database management with `getDb()` and `getCollection()` helpers.
- **Benefits**: Users can access their project's dedicated database without manual configuration or `package.json` bloat.

## 4. Security & Sandboxing

- **Namespace Isolation**: Functions run in dedicated Kubernetes namespaces with restricted ServiceAccounts.
- **Resource Limits**: Strict CPU and RAM quotas enforced per function.
- **Execution Timeouts**: Default timeouts (e.g., 30s) enforced by Fission; configurable per-routine within plan limits.
- **Networking Egress**: Default-deny egress policy, with potential for auditable allow-lists.
- **Safety**: Automated blacklisting of dangerous NPM modules and "takedown" capability to disable specific routines via the management API.

## 5. Development & Deployment Workflow

- **No Local Execution**: All user code runs in Fission (Dev/Staging/Prod environments).
- **Fast Feedback**:
  - Source-only updates when `package.json` is unchanged.
  - Optimized `routines/zip` for delta-only updates.
  - Maintenance of warm Builder pods for fast packaging.

## 6. Observability

- **Log Aggregation**: Fission streams logs to **VictoriaMetrics** (InfluxDB compatible).
- **Log Viewer**: The Dashboard retrieves logs via the Fission/K8s API or directly from VictoriaMetrics, streaming them to the user via WebSockets.
- **Metrics & Billing**:
  - Collection of execution duration, invocation counts, and error rates via Fission's Prometheus metrics.
  - **Compute Time Tracking**: Billing for "Compute Hours" is calculated by querying the `fission_function_execution_duration_seconds_sum` metric in VictoriaMetrics, aggregated by `projectId`. This measures cumulative duration, serving as the primary billing dimension alongside execution counts.

## 7. Implementation Roadmap

### Phase 1: Communication & Infrastructure

- [x] **Step 0**: Implement `@kubernetes/client-node` for Dashboard-to-K3s communication.
- [x] **Step 1**: Setup Wireguard bridge between the Management host and K3s (Serverless).
  - _Detail_: Wireguard is configured directly on the host (not as a Docker Compose service). The Editor API container reaches the K3s cluster via the host's Wireguard interface (`10.30.1.1`).
- [x] **Step 2**: Remove legacy execution code.
  - _Detail_: Uninstall `isolated-vm` dependencies.
  - _Detail_: Remove `function-runner` service from docker-compose files and delete `server/routinesEntry.ts`.

### Phase 2: Packaging & Provisioning

- [x] **Step 3**: Build the **Environment Registry** — MongoDB collection, admin CRUD API, and isDefault enforcement.
  - _Detail_: Seed with initial `node-22` entry matching the environments the admin has created in Fission.
  - _Note_: DELETE endpoint intentionally omitted to prevent breaking active deployments.
- [ ] **Step 4**: Build the **`routines/zip`** utility with glob-based file selection resolved from the environment registry + project overrides.
- [~] **Step 5**: Implement the **Secret Manager** — per-project X25519 keypair generation, hybrid encryption on the client, server-side key storage in `project_keys`, and K8s Secret provisioning at deploy time. See §3.4 for the full scheme.
  - _Status_: Encryption/decryption infrastructure complete. K8s Secret provisioning and RBAC updates will be completed during Step 7 (deploy integration).
- [ ] **Step 6**: Programmatic MongoDB database/user provisioning.

### Phase 3: Deployment & Lifecycle

- [ ] **Step 7**: Implement Fission Function/Package/Trigger management.
  - _Detail_: Implement logic within `editor-api` to create/update Fission packages and functions using the K8s client, passing `--env <name>` from the project's environment list.
  - _Detail_: When a project targets multiple environments, deploy a separate Fission package+function per environment.
- [ ] **Step 8**: Update Nginx proxy logic to route `/routines/` traffic with timeout/payload limits.
- [ ] **Step 9**: Implement Log streaming/viewer in the Dashboard.
- [ ] **Step 10**: Implementation of **Asset Cleanup** to purge old Fission packages and zip archives when deployments are retired.

### Phase 4: Hardening & Optimization

- [ ] **Step 11**: Resource quotas and Namespace-level RBAC.
- [ ] **Step 12**: Builder caching and "New-Deploy" optimizations.
- [ ] **Step 13**: Tier-based execution strategy (Pool Manager vs Scale-to-zero) and execution quota enforcement (250/mo Free | 250k/mo Pro).
- [ ] **Step 14**: Blacklisted module validation and routine "Takedown" mechanism.
- [ ] **Step 15**: Usage tracking and billing integration ($15/mo base fee + $1/25k overage + Compute Time).
