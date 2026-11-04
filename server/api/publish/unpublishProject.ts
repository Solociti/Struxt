import { PublishApi } from "common/api/publish/publish";
import { ProjectEnvSettings } from "common/models/projects/Environment";
import { getCollection } from "server/database/mongodb";
import { deleteCertificate } from "server/npm/certificates";
import { deleteProxyHost } from "server/npm/proxyHosts";
import { deleteRedirectionHost } from "server/npm/redirectionHosts";
import { PublishModel } from "../../../common/models/projects/PublishModel";
import { getProjectData } from "../projects/getProject";
import { saveProject } from "../projects/saveProject";

/**
 * Unpublish the active sites for a project
 *
 * @param projectId
 * @param user
 */
export async function unpublishProject(
  projectId: string,
  user: { userId: string; displayName: string },
): Promise<PublishApi["DeleteResponse"]> {
  console.log(`Unpublished project ${projectId}`);
  const project = await getProjectData(projectId);

  // Get the current published site info for staging and production
  const collection = await getCollection<PublishModel>("projects_published");
  await collection.updateMany(
    { projectId, isActive: true },
    { $set: { isActive: false } },
  );

  // Delete the NPM proxy hosts as needed.
  // deleteProxyHost()
  await clearNpmProxy(project.production);
  await clearNpmProxy(project.staging);

  project.updated = {
    ...project.updated,
    ...user,
    date: Math.floor(Date.now() / 1000),
  };
  await saveProject(project);

  return { success: true };
}

/**
 * Clear the NPM proxy for the environment
 *
 * @param env
 */
async function clearNpmProxy(env: ProjectEnvSettings) {
  if (env.proxy.hostId) {
    try {
      await deleteProxyHost(env.proxy.hostId);
    } catch (err) {
      if (!(err instanceof Error) || err.status !== 404) {
        throw err;
      }
    }
    env.proxy.hostId = 0;
  }

  if (env.proxy.redirectId) {
    try {
      await deleteRedirectionHost(env.proxy.redirectId);
    } catch (err) {
      if (!(err instanceof Error) || err.status !== 404) {
        throw err;
      }
    }
    env.proxy.redirectId = 0;
  }

  if (env.proxy.certificateId) {
    try {
      await deleteCertificate(env.proxy.certificateId);
    } catch (err) {
      if (!(err instanceof Error) || err.status !== 404) {
        throw err;
      }
    }
    env.proxy.certificateId = 0;
  }
}
