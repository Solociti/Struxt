import { getK8sApi } from "server/routines/kubeSetup";
import {
  FISSION_GROUP,
  FISSION_RESOURCE_NAMESPACE,
  FISSION_STORAGESVC_INTERNAL,
  FISSION_VERSION,
  FissionPackage,
  FissionPackageBuildStatus,
  FissionPackageSpec,
} from "server/routines/fission/types";

const PLURAL = "packages";

/**
 * Constructs the internal URL for a Fission archive by ID.
 *
 * @param sourceArchiveId
 */
function getArchiveUrl(sourceArchiveId: string): string {
  const archiveUrl = new URL("/v1/archive", FISSION_STORAGESVC_INTERNAL);
  archiveUrl.searchParams.set("id", sourceArchiveId);
  return archiveUrl.toString();
}

export interface CreatePackageOptions {
  /** 
   * Unique name for the package CRD resource.
   */
  name: string;
  /**
   *  Name of the Fission environment to build with (e.g. "node").
   */
  environmentName: string;
  /**
   * Archive ID from uploadArchive.
   */
  sourceArchiveId: string;
  /**
   * Build command to run (default: "build").
   */
  buildCommand?: string;
  /**
   * Namespace to create the package in (defaults to FISSION_RESOURCE_NAMESPACE).
   */
  namespace?: string;
}

/**
 * Creates a Fission Package CRD that references an already-uploaded source archive.
 *
 * @param opts
 */
export async function createPackage(
  opts: CreatePackageOptions,
): Promise<FissionPackage> {
  const { custom } = await getK8sApi();
  const namespace = opts.namespace ?? FISSION_RESOURCE_NAMESPACE;

  const spec: FissionPackageSpec = {
    environment: { name: opts.environmentName, namespace: "fission" },
    source: {
      type: "url",
      url: getArchiveUrl(opts.sourceArchiveId),
      checksum: {},
    },
    buildcmd: opts.buildCommand ?? "build",
  };

  const body: FissionPackage = {
    apiVersion: "fission.io/v1",
    kind: "Package",
    metadata: { name: opts.name, namespace },
    spec,
  };

  const res = await custom.createNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
    body,
  });

  return res as FissionPackage;
}

/**
 * Retrieves a Fission Package by name.
 *
 * @param name
 * @param namespace
 */
export async function getPackage(
  name: string,
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionPackage> {
  const { custom } = await getK8sApi();

  const res = await custom.getNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
    name,
  });

  return res as FissionPackage;
}

/**
 * Lists all Fission Packages in the given namespace.
 *
 * @param namespace
 */
export async function listPackages(
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionPackage[]> {
  const { custom } = await getK8sApi();

  const res = await custom.listNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
  });

  return (res as { items: FissionPackage[] }).items;
}

/**
 * Replaces a Fission Package's source archive (triggers a rebuild).
 *
 * @param name
 * @param sourceArchiveId Archive ID from `uploadArchive`.
 * @param namespace
 */
export async function updatePackageSource(
  name: string,
  sourceArchiveId: string,
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<FissionPackage> {
  const { custom } = await getK8sApi();

  const existing = await getPackage(name, namespace);

  existing.spec.source = {
    type: "url",
    url: getArchiveUrl(sourceArchiveId),
    checksum: {},
  };

  const res = await custom.replaceNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
    name,
    body: existing,
  });

  return res as FissionPackage;
}

/**
 * Deletes a Fission Package by name.
 *
 * @param name
 * @param namespace
 */
export async function deletePackage(
  name: string,
  namespace = FISSION_RESOURCE_NAMESPACE,
): Promise<void> {
  const { custom } = await getK8sApi();

  await custom.deleteNamespacedCustomObject({
    group: FISSION_GROUP,
    version: FISSION_VERSION,
    namespace,
    plural: PLURAL,
    name,
  });
}

/**
 * Polls a package until its build status reaches a terminal state.
 * Rejects if the build fails or the timeout is exceeded.
 *
 * @param name
 * @param namespace
 * @param timeoutMs
 * @param pollIntervalMs
 */
export async function waitForPackageBuild(
  name: string,
  namespace = FISSION_RESOURCE_NAMESPACE,
  timeoutMs = 120_000,
  pollIntervalMs = 2_000,
): Promise<FissionPackage> {
  const terminal: FissionPackageBuildStatus[] = ["succeeded", "failed", "none"];
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const pkg = await getPackage(name, namespace);
    const status = pkg.status?.buildstatus;

    if (status && terminal.includes(status)) {
      if (status === "failed") {
        throw new Error(
          `Package "${name}" build failed: ${pkg.status?.buildlog ?? "(no log)"}`,
        );
      }
      return pkg;
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error(
    `Package "${name}" build did not complete within ${timeoutMs}ms`,
  );
}
