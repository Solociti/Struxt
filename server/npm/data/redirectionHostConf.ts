import { ProjectEnvSettings } from "common/models/projects/Environment";
import { RedirectHostUpdate } from "../types";

/**
 * Create the default configuration for a redirection host.
 *
 * @returns
 */
export function createRedirectionHostConf(): RedirectHostUpdate {
  return {
    domain_names: [],
    forward_scheme: "https",
    forward_domain_name: "",
    forward_http_code: 302,
    preserve_path: true,

    block_exploits: true,
    http2_support: true,

    certificate_id: 0,
    ssl_forced: true,
    hsts_enabled: true,
    hsts_subdomains: false,

    advanced_config: "",
    meta: {},
  };
}

/**
 * Update the redirection host conf with the given domains and settings.
 *
 * @param conf
 * @param domains
 * @param envSettings
 * @param primaryDomain
 * @returns
 */
export function updateRedirectionHostConf(
  conf: RedirectHostUpdate,
  domains: string[],
  envSettings: ProjectEnvSettings,
  primaryDomain: string
): RedirectHostUpdate {
  conf.domain_names = domains;

  conf.forward_scheme = envSettings.forceSsl ? "https" : "http";
  conf.forward_domain_name = primaryDomain;

  conf.forward_http_code = 302;

  conf.certificate_id = envSettings.proxy.certificateId;
  conf.ssl_forced = envSettings.forceSsl;
  conf.hsts_enabled = envSettings.hsts;
  conf.hsts_subdomains = false;

  return conf;
}
