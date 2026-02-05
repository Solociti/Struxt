import { relative, normalize, join } from "common/path/path";

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

  if (path.endsWith("/") && !updated.endsWith("/")) {
    return updated + "/";
  }
  return updated;
}
