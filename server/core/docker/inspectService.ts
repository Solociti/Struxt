import { execPromise } from "server/utils/execPromise";

/**
 * Inspect a Docker service by its name or ID.
 *
 * @param container name or ID of the service to inspect
 * @returns
 */
export async function dockerInspectService(container: string) {
  const command = `docker inspect ${container}`;

  const { stdout, stderr } = await execPromise(command);

  if (stderr) {
    throw new Error(`Error inspecting service ${container}: ${stderr}`);
  }
  if (!stdout) {
    throw new Error(`No output from docker inspect for service ${container}`);
  }

  try {
    const serviceInfo: DockerInspect[] = JSON.parse(stdout);
    return serviceInfo.pop() as DockerInspect;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON output from docker inspect: ${error}`
    );
  }
}

interface DockerInspect {
  Id: string;
  Created: string;
  Path: string;
  Args: string[];
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    OOMKilled: boolean;
    Dead: boolean;
    Pid: number;
    ExitCode: number;
    Error: string;
    StartedAt: string;
    FinishedAt: string;
  };
  Image: string;
  ResolvConfPath: string;
  HostnamePath: string;
  HostsPath: string;
  LogPath: string;
  Name: string;
  RestartCount: number;
  Driver: string;
  Platform: string;
  MountLabel: string;
  ProcessLabel: string;
  AppArmorProfile: string;
  ExecIDs: string[] | null;
  HostConfig: {
    Binds: string[];
    ContainerIDFile: string;
    LogConfig: {
      Type: string;
      Config: Record<string, string>;
    };
    NetworkMode: string;
    PortBindings: {
      [port: string]: Array<{
        HostIp: string;
        HostPort: string;
      }>;
    };
    RestartPolicy: {
      Name: string;
      MaximumRetryCount: number;
    };
    AutoRemove: boolean;
    VolumeDriver: string;
    VolumesFrom: string[] | null;
    ConsoleSize: [number, number];
    CapAdd: string[] | null;
    CapDrop: string[] | null;
    CgroupnsMode: string;
    Dns: string[];
    DnsOptions: string[];
    DnsSearch: string[];
    ExtraHosts: string[];
    GroupAdd: string[] | null;
    IpcMode: string;
    Cgroup: string;
    Links: string[] | null;
    OomScoreAdj: number;
    PidMode: string;
    Privileged: boolean;
    PublishAllPorts: boolean;
    ReadonlyRootfs: boolean;
    SecurityOpt: string[] | null;
    UTSMode: string;
    UsernsMode: string;
    ShmSize: number;
    Runtime: string;
    Isolation: string;
    CpuShares: number;
    Memory: number;
    NanoCpus: number;
    CgroupParent: string;
    BlkioWeight: number;
    BlkioWeightDevice: any;
    BlkioDeviceReadBps: any;
    BlkioDeviceWriteBps: any;
    BlkioDeviceReadIOps: any;
    BlkioDeviceWriteIOps: any;
    CpuPeriod: number;
    CpuQuota: number;
    CpuRealtimePeriod: number;
    CpuRealtimeRuntime: number;
    CpusetCpus: string;
    CpusetMems: string;
    Devices: any;
    DeviceCgroupRules: any;
    DeviceRequests: any;
    MemoryReservation: number;
    MemorySwap: number;
    MemorySwappiness: number | null;
    OomKillDisable: boolean | null;
    PidsLimit: number | null;
    Ulimits: any;
    CpuCount: number;
    CpuPercent: number;
    IOMaximumIOps: number;
    IOMaximumBandwidth: number;
    MaskedPaths: string[];
    ReadonlyPaths: string[];
  };
  GraphDriver: {
    Data: {
      ID: string;
      LowerDir: string;
      MergedDir: string;
      UpperDir: string;
      WorkDir: string;
    };
    Name: string;
  };
  Mounts: Array<{
    Type: string;
    Source?: string;
    Name?: string;
    Destination: string;
    Mode: string;
    RW: boolean;
    Propagation: string;
    Driver?: string;
  }>;
  Config: {
    Hostname: string;
    Domainname: string;
    User: string;
    AttachStdin: boolean;
    AttachStdout: boolean;
    AttachStderr: boolean;
    ExposedPorts: {
      [port: string]: Record<string, never>;
    };
    Tty: boolean;
    OpenStdin: boolean;
    StdinOnce: boolean;
    Env: string[];
    Cmd: string[];
    Image: string;
    Volumes: any;
    WorkingDir: string;
    Entrypoint: string[];
    OnBuild: any;
    Labels: {
      [key: string]: string;
    };
  };
  NetworkSettings: {
    Bridge: string;
    SandboxID: string;
    SandboxKey: string;
    Ports: {
      [port: string]: Array<{
        HostIp: string;
        HostPort: string;
      }>;
    };
    HairpinMode: boolean;
    LinkLocalIPv6Address: string;
    LinkLocalIPv6PrefixLen: number;
    SecondaryIPAddresses: any;
    SecondaryIPv6Addresses: any;
    EndpointID: string;
    Gateway: string;
    GlobalIPv6Address: string;
    GlobalIPv6PrefixLen: number;
    IPAddress: string;
    IPPrefixLen: number;
    IPv6Gateway: string;
    MacAddress: string;
    Networks: {
      [network: string]: {
        IPAMConfig: any;
        Links: string[] | null;
        Aliases: string[];
        MacAddress: string;
        DriverOpts: any;
        GwPriority: number;
        NetworkID: string;
        EndpointID: string;
        Gateway: string;
        IPAddress: string;
        IPPrefixLen: number;
        IPv6Gateway: string;
        GlobalIPv6Address: string;
        GlobalIPv6PrefixLen: number;
        DNSNames: string[];
      };
    };
  };
}
