import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { saveProject } from "server/api/projects/saveProject";
import { getProxyHosts } from "server/npm/proxyHosts";
import { getRedirectionHosts } from "server/npm/redirectionHosts";
import { getCollection, toArray } from "../mongodb";

export async function up() {
  // match the npm config to the the projects

  const proxyHosts = await getProxyHosts();
  const redirectHosts = await getRedirectionHosts();

  // get all of the projects in the database
  const collection = await getCollection<ProjectModel>("projects");
  const projects = await toArray(collection.find({}));

  for (const doc of projects) {
    const project = new ProjectModel(doc);

    let updated = false;

    for (const env of ["staging", "production"] as EnvironmentTypes[]) {
      const envSettings = project[env];

      const primaryDomain = project.getPrimaryDomain(env);
      if (!primaryDomain) {
        continue;
      }
      const redirectDomains = envSettings.domains.filter(
        (d) => d.domain !== primaryDomain.domain && !d.isPrimary
      );

      let proxyHostId = 0;
      let redirectHostId = 0;
      let certificateId = 0;

      // get the proxy host id by matching the domain name
      for (const proxyHost of proxyHosts) {
        if (proxyHost.domain_names.join("") === primaryDomain.domain) {
          proxyHostId = proxyHost.id;
          certificateId = proxyHost.certificate_id;
        }
      }

      // get the redirect host id by matching the domain names
      for (const redirectHost of redirectHosts) {
        const rHostDomains = redirectHost.domain_names.sort().join(",");
        const rDomains = redirectDomains
          .map((d) => d.domain)
          .sort()
          .join(",");

        if (rHostDomains === rDomains) {
          redirectHostId = redirectHost.id;
        }
      }

      if (proxyHostId) {
        // update the project data with the ids
        envSettings.proxy = {
          ...envSettings.proxy,
          certificateId,
          hostId: proxyHostId,
          redirectId: redirectHostId,
        };
        updated = true;
      }
    }

    if (updated) {
      await saveProject(project);
    }
  }
}

export async function down() {}
