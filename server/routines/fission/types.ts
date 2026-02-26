export const fissionGroup = "fission.io";
export const fissionVersion = "v1";

/**
 * Namespace where Fission system resources live (storagesvc, etc.).
 */
export const fissionNamespace = "fission";

/**
 * Namespace where user-facing resources (packages, functions, triggers, environments) are created.
 */
export const fissionResourceNamespace = "default";

/**
 * Internal K8s service URL for the Fission storage service.
 * Used as the base for archive references inside package specs — reachable by
 * Fission builder/executor pods running on the cluster.
 */
export const fissionStoragesvcInternal =
  "http://storagesvc.fission.svc.cluster.local";

export interface FissionObjectMeta {
  name: string;
  namespace: string;
  resourceVersion?: string;
  uid?: string;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface FissionCrdObject<TSpec> {
  apiVersion: "fission.io/v1";
  kind: string;
  metadata: FissionObjectMeta;
  spec: TSpec;
}

/**
 * Fission archive — either an inline literal (base64) or a URL reference.
 */
export interface FissionArchive {
  type: "literal" | "url";
  /**
   * Base64-encoded bytes (used when type is "literal").
   */
  literal?: string;
  /**
   * Internal cluster URL returned by the storagesvc (used when type is "url").
   */
  url?: string;
  checksum?: {
    type?: string;
    sum?: string;
  };
}

/**
 * Fission Environment CRD spec.
 */
export interface FissionEnvironmentSpec {
  version: number;
  runtime: {
    image: string;
  };
  builder?: {
    image?: string;
    command?: string;
  };
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  poolsize?: number;
  allowedFunctionsPerContainer?: "single" | "multiple" | "infinite";
  allowAccessToExternalNetwork?: boolean;
  keeparchive?: boolean;
  /**
   * Name of the K8s secret used to pull the environment image from a private registry.
   */
  imagepullsecret?: string;
}

/**
 * Fission Package CRD spec.
 */
export interface FissionPackageSpec {
  environment: {
    name: string;
    namespace: string;
  };
  source?: FissionArchive;
  deployment?: FissionArchive;
  buildcmd?: string;
}

export type FissionPackageBuildStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "none";

export interface FissionPackageStatus {
  buildstatus?: FissionPackageBuildStatus;
  buildlog?: string;
  lastUpdateTimestamp?: string;
}

export interface FissionPackage extends FissionCrdObject<FissionPackageSpec> {
  kind: "Package";
  status?: FissionPackageStatus;
}

export type FissionEnvironment = FissionCrdObject<FissionEnvironmentSpec> & {
  kind: "Environment";
};

/**
 * Reference to a Fission package with its resolved resource version.
 */
export interface FissionPackageRef {
  name: string;
  namespace: string;
  resourceversion?: string;
}

/**
 * Fission Function CRD spec.
 */
export interface FissionFunctionSpec {
  environment: {
    name: string;
    namespace: string;
  };
  package: {
    packageref?: FissionPackageRef;
    functionName?: string;
  };
  secrets?: Array<{ name: string; namespace: string }>;
  configmaps?: Array<{ name: string; namespace: string }>;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  InvokeStrategy?: {
    /**
     * JSON tag: StrategyType (capital S — matches Go source).
     */
    StrategyType: "execution";
    /**
     * JSON tag: ExecutionStrategy (capital E — matches Go source).
     */
    ExecutionStrategy: {
      ExecutorType: "newdeploy" | "poolmgr" | "container";
      MinScale?: number;
      MaxScale?: number;
      TargetCPUPercent?: number;
      SpecializationTimeout?: number;
    };
  };
  functionTimeout?: number;
  idletimeout?: number;
  concurrency?: number;
  requestsPerPod?: number;
}

export type FissionFunction = FissionCrdObject<FissionFunctionSpec> & {
  kind: "Function";
};

/**
 * Fission HTTPTrigger CRD spec.
 */
export interface FissionHttpTriggerSpec {
  relativeurl: string;
  methods: string[];
  functionref: {
    /**
     * "name" for a direct function reference; "function-weights" for canary splits.
     */
    type: "name" | "function-weights";
    name?: string;
    functionweights?: Record<string, number> | null;
  };
  host?: string;
  createingress?: boolean;
  /** JSON tag: ingressconfig (all lowercase — matches Go source). */
  ingressconfig?: object;
  prefix?: string | null;
  keepPrefix?: boolean;
}

export type FissionHttpTrigger = FissionCrdObject<FissionHttpTriggerSpec> & {
  kind: "HTTPTrigger";
};

/**
 * Fission TimeTrigger CRD spec.
 */
export interface FissionTimeTriggerSpec {
  cron: string;
  functionref: {
    type: "name";
    name: string;
    functionweights?: null;
  };
  /**
   * HTTP method used when invoking the function (default: "POST").
   */
  method?: string;
  /**
   * Subpath appended when invoking the function (default: "/").
   */
  subpath?: string;
}

export type FissionTimeTrigger = FissionCrdObject<FissionTimeTriggerSpec> & {
  kind: "TimeTrigger";
};
