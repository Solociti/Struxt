import { join, normalize, relative } from "common/path/path";
import { sanitizePath } from "common/path/sanitizeFilename";

/**
 * Re-write an asset path from one base to another
 *
 * @param path
 * @param from
 * @param to
 * @returns
 */
export function reWriteAssetPath(path: string, from: string, to: string) {
  const rel = relative(from, path);
  const updated = normalize(join(to, rel));
  const sanitized = sanitizePath(updated);

  if (path.endsWith("/") && !sanitized.endsWith("/")) {
    return sanitized + "/";
  }
  return sanitized;
}
