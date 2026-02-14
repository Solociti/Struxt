import { isAbsolute, normalize, relative } from "common/path/path";

export function isChildDir(parent: string, child: string): boolean {
  if (!isAbsolute(parent) || !isAbsolute(child)) {
    return false;
  }

  const relPath = relative(parent, child);
  if (!relPath) {
    return false;
  }

  const isRelative = !isAbsolute(relPath);
  const doesNotStartWDots = !relPath.startsWith("..");

  return isRelative && doesNotStartWDots;
}

/**
 * Validate that the source can be moved to the destination
 *
 * @param source
 * @param destination
 * @returns
 */
export function validateMoveLocation(source: string, destination: string) {
  if (!destination) {
    return { isValid: false, warningMessage: "" };
  }

  if (!isAbsolute(destination) || !isAbsolute(source)) {
    return {
      isValid: false,
      warningMessage: "Both source and destination must be absolute paths.",
    };
  }

  if (normalize(destination) === normalize(source)) {
    return {
      isValid: false,
      warningMessage: "Cannot move to the same directory.",
    };
  }

  if (isChildDir(source, destination)) {
    return {
      isValid: false,
      warningMessage: "Cannot move to a sub-directory of itself.",
    };
  }

  return { isValid: true, warningMessage: "" };
}
