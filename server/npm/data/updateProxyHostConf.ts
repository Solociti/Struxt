import {
  EnvironmentTypes,
  ProjectEnvSettings,
} from "common/models/projects/Environment";
import {
  createDefaultProxyHostConf,
  createEditorProxyPaths,
} from "server/npm/data/createProxyHostConf";
import { ProxyHostUpdate } from "server/npm/types";

/**
 * Update the advanced config string with the default values
 *
 * @param currentConf
 * @param defaultConf
 * @returns
 */
export function updateAdvancedConfig(
  currentConf: string,
  defaultConf: string
): string {
  const [_, customConf] = currentConf.split("# -- End of struxt config --");

  return `${defaultConf}${customConf || ""}`;
}

/**
 * Update existing proxy settings with the updated project details
 *
 * @param proxy
 * @param param1
 * @returns
 */
export function updateProxyHostConf(
  proxy: ProxyHostUpdate,
  {
    projectId,
    projectEnv,
    envSettings,
    publishId,
    domains,
    isEditorSite,
  }: {
    projectId: string;
    projectEnv: EnvironmentTypes;
    envSettings: ProjectEnvSettings;
    isEditorSite: boolean;
    publishId: string;
    domains: string[];
  }
): ProxyHostUpdate {
  // get the new proxy host settings as default values
  const newProxy = createDefaultProxyHostConf();

  if (isEditorSite) {
    // add the editor proxy paths
    newProxy.locations.push(...createEditorProxyPaths());

    // allow web sockets for socket.io connections
    proxy.allow_websocket_upgrade = true;
  }

  // set the ssl settings
  proxy.ssl_forced = envSettings.forceSsl;
  proxy.hsts_enabled = envSettings.hsts;

  // set the domains
  proxy.domain_names = domains;

  // set the host details
  proxy.forward_scheme = newProxy.forward_scheme;
  proxy.forward_host = newProxy.forward_host;
  proxy.forward_port = newProxy.forward_port;

  // ensure that the advanced config is set
  proxy.advanced_config = updateAdvancedConfig(
    proxy.advanced_config,
    newProxy.advanced_config
  );

  // set the certificate id
  proxy.certificate_id = envSettings.proxy.certificateId;

  // ensure that all of the routes from a net setup are present
  for (const location of newProxy.locations) {
    const host = location.forward_host
      .replace(":projectId", projectId)
      .replace(":publishId", publishId)
      .replace(":projectEnv", projectEnv);
    location.forward_host = host;

    // find the existing location
    const existingLocation = proxy.locations.find(
      (l) => l.path === location.path
    );

    if (!existingLocation) {
      proxy.locations.push(location);
    } else {
      // update the existing location with the new values
      existingLocation.forward_scheme = location.forward_scheme;
      existingLocation.forward_port = location.forward_port;

      // ensure that the advanced config is set
      existingLocation.advanced_config = updateAdvancedConfig(
        existingLocation.advanced_config,
        location.advanced_config
      );

      existingLocation.forward_host = location.forward_host;
    }
  }

  return proxy;
}
