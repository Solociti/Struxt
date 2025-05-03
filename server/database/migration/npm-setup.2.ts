import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { saveProject } from "server/api/projects/saveProject";
import { getProxyHosts } from "server/npm/proxyHosts";
import { getRedirectionHosts } from "server/npm/redirectionHosts";
import { getCollection, toArray } from "../mongodb";

export async function up() {
  // match the npm config to the the projects
  // TODO: setup the default project nginx proxy settings
}

export async function down() {}
