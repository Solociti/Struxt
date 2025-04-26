import { customError } from "common/custom-error/custom-error";
import { ProjectDomain } from "common/models/projects/Environment";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { PublishModel } from "common/models/projects/PublishModel";
import {
  createProxyHost,
  getProxyHost,
  updateProxyHost,
} from "server/npm/proxyHosts";
import { ProxyHostUpdate } from "server/npm/types";

/**
 * Update the proxy host for the given project and publish
 *
 * @param project
 * @param publish
 */
export async function updateProjectProxyHost(
  project: ProjectModel,
  publish: PublishModel
) {
  const env = publish.siteEnv;
  const envSettings = project[env];

  const primaryDomain = project.getPrimaryDomain(env);
  if (!primaryDomain) {
    throw customError(400, "No primary domain found for the project");
  }

  const redirectDomains = envSettings.domains.filter(
    (d) => d.domain !== primaryDomain.domain && !d.isPrimary
  );

  // check if the proxy host is set
  if (envSettings.proxy.hostId) {
    // update the existing proxy host
    const proxyHost = await getProxyHost(envSettings.proxy.hostId);
    updateProxySettings(proxyHost, project, publish, [primaryDomain]);

    await updateProxyHost(envSettings.proxy.hostId, proxyHost);
  } else {
    // create a new proxy host
    const proxyHost = createNewProxySettings();
    updateProxySettings(proxyHost, project, publish, [primaryDomain]);

    const newProxyHost = await createProxyHost(proxyHost);
    envSettings.proxy.hostId = newProxyHost.id;
  }

  // check if a redirect is needed
  if (redirectDomains.length > 0) {
    if (envSettings.proxy.redirectId) {
      // update the existing redirect
    } else {
      // create a new redirect
    }
  }

  // check if a certificate is needed
  if (envSettings.proxy.certificateId) {
    // update the existing certificate
  } else {
    // create a new certificate
  }
}

function updateProxySettings(
  proxy: ProxyHostUpdate,
  project: ProjectModel,
  publish: PublishModel,
  domains: ProjectDomain[]
): ProxyHostUpdate {
  const env = project.staging ? "staging" : "production";
  const envSettings = project[env];

  // set the ssl settings
  proxy.ssl_forced = envSettings.forceSsl;
  proxy.hsts_enabled = envSettings.hsts;

  // set the domains
  proxy.domain_names = domains.map((d) => d.domain);

  // set the host details
  proxy.forward_scheme = "http";
  proxy.forward_host = "web-host";
  proxy.forward_port = 3000;

  // set the certificate id
  proxy.certificate_id = envSettings.proxy.certificateId;

  for (const location of proxy.locations) {
    if (location.path === "/") {
      location.forward_host = `web-host/sites/${project.projectId}/${publish.uuid}`;
      location.forward_port = 3000;
    }

    if (location.path === "/submit") {
      location.forward_host = `editor-api/forms/submit/${project.projectId}/${env}`;
      location.forward_port = 3000;
    }
  }

  return proxy;
}

function createNewProxySettings(): ProxyHostUpdate {
  return {
    domain_names: [],
    forward_scheme: "http",
    forward_host: "web-host",
    forward_port: 3000,
    certificate_id: 0,
    ssl_forced: true,
    hsts_enabled: true,
    hsts_subdomains: false,
    http2_support: true,
    block_exploits: true,
    caching_enabled: false,
    allow_websocket_upgrade: false,
    access_list_id: 0,
    advanced_config: "proxy_request_buffering off;\nclient_max_body_size 0;",
    enabled: true,
    meta: {},
    locations: [
      {
        path: "/",
        advanced_config:
          '# Redirect index.html to root path while preserving query parameters\nif ($request_uri ~* "^(.*)/index\\.html(.*)$") {\nreturn 301 $1/$2;\n}',
        forward_scheme: "http",
        forward_host: "web-host/",
        forward_port: 3000,
      },
      {
        path: "/submit",
        advanced_config:
          "proxy_request_buffering off;\nclient_max_body_size 50M;",
        forward_scheme: "http",
        forward_host: "editor-api/",
        forward_port: 3000,
      },
    ],
  };
}
