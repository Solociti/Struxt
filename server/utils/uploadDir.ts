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
 * Get the site publish directory
 *
 * @param type
 * @param projectId
 * @returns
 */
export function getSiteDir(type: "staging" | "production", projectId: string) {
  let baseDir = env.SITE_STORAGE_DIR || "/sites";
  if (env.IS_DOCKER === "true") {
    baseDir = "/sites";
  }

  return path.join(baseDir, projectId, type);
}
