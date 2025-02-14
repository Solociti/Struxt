import path from "node:path";

/**
 * Get hte upload directory
 *
 * @param paths
 * @returns
 */
export function getUploadDir(...paths: string[]) {
  let baseDir = process.env.UPLOAD_DIR || "/uploads";
  if (process.env.IS_DOCKER === "true") {
    baseDir = "/uploads";
  }

  return path.join(baseDir, ...paths);
}
