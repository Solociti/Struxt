import path from "node:path";
import { env } from "node:process";

/**
 * Get the upload directory
 *
 * @param paths
 * @returns
 */
export function getUploadDir(...paths: string[]) {
  let baseDir = env.UPLOAD_DIR || "/uploads";
  if (env.IS_DOCKER === "true") {
    baseDir = "/uploads";
  }

  return path.join(baseDir, ...paths);
}

/**
 * Get the asset directory for the given project
 *
 * @param projectId
 * @returns
 */
export function getAssetDir(projectId?: string) {
  return getUploadDir("projects", projectId || "");
}

/**
 * Get the upload directory for any uploads from the sites forms
 *
 * @param projectId
 *
 * @returns
 */
export function getProjectFormUploadDir(projectId: string | number) {
  return getUploadDir("projects", projectId.toString(), "forms");
}

/**
 * Get the base publish directory
 *
 * @returns
 */
export function getBasePublishDir() {
  let baseDir = env.SITE_STORAGE_DIR || "/sites";
  if (env.IS_DOCKER === "true") {
    baseDir = "/sites";
  }
  return baseDir;
}

/**
 * Get the publish directory for the given project and publish id
 *
 * @param projectId
 * @param publishId
 * @returns
 */
export function getPublishDir(projectId: string, publishId: string) {
  const baseDir = getBasePublishDir();

  return path.join(baseDir, projectId, publishId);
}
