import { isAbsolute, relative } from "node:path";

/**
 * Checks if a path is inside another path.
 *
 * @param childPath The path to check (must be absolute)
 * @param parentPath The parent path to check against (must be absolute)
 */
export function isPathInside(childPath: string, parentPath: string): boolean {
  if (!isAbsolute(childPath) || !isAbsolute(parentPath)) {
    throw new Error("paths must be absolute");
  }

  const relativePath = relative(parentPath, childPath);

  const isRelative = !isAbsolute(relativePath);
  const doesNotStartWDots = !relativePath.startsWith("..");

  if (isRelative && doesNotStartWDots) {
    return true;
  }

  return false;
}
