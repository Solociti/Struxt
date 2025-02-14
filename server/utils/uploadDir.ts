import path from "node:path";
import { env } from "node:process";

/**
 * Get hte upload directory
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
