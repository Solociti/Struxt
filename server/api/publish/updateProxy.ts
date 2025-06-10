import { customError } from "common/custom-error/custom-error";
import {
  EnvironmentTypes,
  getValidDomains,
  ProjectDomain,
  ProjectEnvSettings,
} from "common/models/projects/Environment";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { PublishModel } from "common/models/projects/PublishModel";
import { createCertificate, getCertificate } from "server/npm/certificates";
import { createDefaultProxyHostConf } from "server/npm/data/createProxyHostConf";
import {
  createRedirectionHostConf,
  updateRedirectionHostConf,
} from "server/npm/data/redirectionHostConf";
import {
  createProxyHost,
  getProxyHost,
  updateProxyHost,
} from "server/npm/proxyHosts";
import {
  createRedirectionHost,
  deleteRedirectionHost,
  getRedirectionHost,
  updateRedirectionHost,
} from "server/npm/redirectionHosts";
import {
  ProxyHostResponse,
  ProxyHostUpdate,
  RedirectHostResponse,
  RedirectHostUpdate,
} from "server/npm/types";
import { updateProxyHostConf } from "../../npm/data/updateProxyHostConf";

/**
 * Update all of the proxy settings for the given project.
 *
 * @param project
 * @param publish
 */
export async function updateProjectProxy(
  project: ProjectModel,
  publish: PublishModel
) {
  console.log("Updating project proxy settings");

  const env = publish.siteEnv;
  const envSettings = project[env];

  // get the list of valid domains
  const { domains, primaryDomain, redirectDomains } =
    getValidDomains(envSettings);

  if (!primaryDomain) {
    throw customError(400, "No primary domain found for the project");
  }

  // check if a certificate is needed
  let createNewCert = false;
  if (envSettings.proxy.certificateId) {
    // check if the certificate contains the correct domains
    // if not, create a new certificate
    const certificate = await getCertificate(envSettings.proxy.certificateId);

    // create string sets of the domains to match them
    const certDomainStr = certificate.domain_names.slice().sort().join(",");
    const domainStr = domains
      .map((d) => d.domain)
      .sort()
      .join(",");

    const isMatch = certDomainStr === domainStr;
    if (!isMatch && envSettings.forceSsl) {
      createNewCert = true;
    }
  } else if (envSettings.forceSsl) {
    // create a new certificate
    createNewCert = true;
  }

  let letsEncryptEnabled = true;
  if (
    (createNewCert && process.env.LETSENCRYPT_LICENSE !== "accept") ||
    !process.env.LETSENCRYPT_EMAIL
  ) {
    console.log(
      "Skipping host certificate update because the letsencrypt license is not accepted."
    );
    letsEncryptEnabled = false;
  }

  if (createNewCert && letsEncryptEnabled) {
    const oldCertId = envSettings.proxy.certificateId;

    // create a new certificate
    const newCertificate = await createCertificate({
      domain_names: domains.map((d) => d.domain),
      nice_name: `${project.name} - ${env}`,
      provider: "letsencrypt",
      meta: {
        letsencrypt_agree: true,
        letsencrypt_email: process.env.LETSENCRYPT_EMAIL || "",
        dns_challenge: false,
        propagation_seconds: 0,
      },
    });
    envSettings.proxy.certificateId = newCertificate.id;

    if (oldCertId) {
      // TODO: schedule a delete for the old certificate
      // don't want to immediately delete the old certificate
      // in case the domains get added back and we can reuse it
    }
  }

  // check if the proxy host is set
  const hostId = await configureProxyHost(project, env, publish, [
    primaryDomain,
  ]);

  if (envSettings.proxy.hostId !== hostId) {
    envSettings.proxy.hostId = hostId;
  }

  // check if a redirect is needed
  if (redirectDomains.length > 0) {
    envSettings.proxy.redirectId = await configureRedirectionHosts(
      envSettings,
      redirectDomains,
      primaryDomain
    );
  }
}

/**
 * Configure the redirection hosts for the given project.
 *
 * @param envSettings
 * @param redirectDomains
 * @param primaryDomain
 */
async function configureRedirectionHosts(
  envSettings: ProjectEnvSettings,
  redirectDomains: ProjectDomain[],
  primaryDomain: ProjectDomain
): Promise<number> {
  const redirectId = envSettings.proxy.redirectId;

  if (redirectId) {
    if (redirectDomains.length === 0) {
      // delete the existing redirect
      await deleteRedirectionHost(redirectId);
      return 0;
    }

    // update the existing redirect
    const redirectHost: RedirectHostUpdate & Partial<RedirectHostResponse> =
      await getRedirectionHost(redirectId);

    // remove the unwanted fields from the data
    // these need to be removed to send the update request
    if (typeof redirectHost.id !== "undefined") {
      delete redirectHost.id;
    }
    if (typeof redirectHost.created_on !== "undefined") {
      delete redirectHost.created_on;
    }
    if (typeof redirectHost.modified_on !== "undefined") {
      delete redirectHost.modified_on;
    }
    if (typeof redirectHost.owner_user_id !== "undefined") {
      delete redirectHost.owner_user_id;
    }
    if (typeof redirectHost.enabled !== "undefined") {
      delete redirectHost.enabled;
    }

    updateRedirectionHostConf(
      redirectHost,
      redirectDomains.map((d) => d.domain),
      envSettings,
      primaryDomain.domain
    );

    await updateRedirectionHost(redirectId, redirectHost);

    return redirectId;
  }

  if (redirectDomains.length > 0) {
    const redirectHost = createRedirectionHostConf();
    updateRedirectionHostConf(
      redirectHost,
      redirectDomains.map((d) => d.domain),
      envSettings,
      primaryDomain.domain
    );

    // create a new redirect
    const newRedirectionHost = await createRedirectionHost(redirectHost);
    return newRedirectionHost.id;
  }

  return redirectId;
}

/**
 * Configure the proxy host for the given project.
 *
 * @param projectEnv
 * @param envSettings
 * @param publish
 * @param domains
 */
async function configureProxyHost(
  project: ProjectModel,
  projectEnv: EnvironmentTypes,
  publish: PublishModel,
  domains: ProjectDomain[]
) {
  const envSettings = project[projectEnv];
  const hostId = envSettings.proxy.hostId;
  const domainNames = domains.map((d) => d.domain);

  if (hostId) {
    // update the existing proxy host
    const proxyHost: ProxyHostUpdate & Partial<ProxyHostResponse> =
      await getProxyHost(hostId);

    // remove the unwanted fields from the data
    // these need to be removed to send the update request
    if (proxyHost.id) {
      delete proxyHost.id;
    }
    if (proxyHost.created_on) {
      delete proxyHost.created_on;
    }
    if (proxyHost.modified_on) {
      delete proxyHost.modified_on;
    }
    if (proxyHost.owner_user_id) {
      delete proxyHost.owner_user_id;
    }

    updateProxyHostConf(proxyHost, {
      projectId: project.projectId,
      projectEnv,
      envSettings,
      publishId: publish.uuid,
      domains: domainNames,
      isEditorSite: Boolean(project.isEditorSite),
    });

    await updateProxyHost(hostId, proxyHost);
    return hostId;
  }

  // create a new proxy host
  const proxyHost = createDefaultProxyHostConf();
  updateProxyHostConf(proxyHost, {
    projectId: project.projectId,
    projectEnv,
    envSettings,
    publishId: publish.uuid,
    domains: domainNames,
    isEditorSite: Boolean(project.isEditorSite),
  });

  const newProxyHost = await createProxyHost(proxyHost);

  return newProxyHost.id;
}
