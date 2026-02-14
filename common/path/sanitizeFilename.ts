/**
 * Cross-platform filename sanitization utilities
 *
 * Based on Wikipedia filename rules to ensure files created on Linux
 * are safely downloadable/usable on Windows and macOS systems.
 *
 * @see https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
 */

import { join, normalize } from "./path";

/**
 * Characters that are invalid in filenames across major filesystems:
 * - / (Unix path separator)
 * - \ (Windows path separator)
 * - ? (wildcard)
 * - * (wildcard)
 * - : (Windows drive separator, macOS classic separator)
 * - | (pipe)
 * - " (quote)
 * - < > (redirect operators)
 * - \x00-\x1F (control characters including null)
 * - \x7F-\x9F (additional control characters)
 */
const INVALID_FILENAME_CHARS = /[/\\?*:|"<>\x00-\x1F\x7F-\x9F]/g;

/**
 * Default maximum filename length (200 characters provides a safe buffer for
 * filesystem operations while allowing reasonable filename lengths)
 */
export const DEFAULT_MAX_FILENAME_LENGTH = 200;

/**
 * Default maximum path length (255 characters is the most common limit
 * across NTFS, ext4, APFS, HFS+ filesystems)
 */
export const DEFAULT_MAX_PATH_LENGTH = 255;

/**
 * Validates whether a filename contains only valid characters
 *
 * @param filename - The filename to validate (without path)
 * @returns true if the filename is valid, false otherwise
 */
export function isValidFilename(filename: string): boolean {
  if (typeof filename !== "string" || filename.length === 0) {
    return false;
  }

  // Check for invalid characters (use match to avoid regex /g flag state issues)
  if (filename.match(INVALID_FILENAME_CHARS)) {
    return false;
  }

  // Check length (before trimming, as we want to catch overly long names)
  if (filename.length > DEFAULT_MAX_FILENAME_LENGTH) {
    return false;
  }

  // Check that after trimming spaces, we still have a valid name
  const trimmed = filename.trim();
  if (trimmed.length === 0) {
    return false;
  }

  // Special directory names are not valid filenames
  if (trimmed === "." || trimmed === "..") {
    return false;
  }

  return true;
}

/**
 * Gets a list of specific validation errors for a filename
 *
 * @param filename - The filename to validate
 * @returns Array of human-readable error messages (empty if valid)
 */
export function getFilenameValidationErrors(filename: string): string[] {
  const errors: string[] = [];

  if (typeof filename !== "string") {
    errors.push("Filename must be a string");
    return errors;
  }

  if (filename.length === 0) {
    errors.push("Filename can't be empty");
    return errors;
  }

  const trimmed = filename.trim();
  if (trimmed.length === 0) {
    errors.push("Filename can't be only whitespace");
  }

  if (trimmed === "." || trimmed === "..") {
    errors.push('Filename can\'t be "." or ".."');
  }

  // Check for specific invalid characters
  const invalidChars = new Set<string>();
  const matches = filename.match(INVALID_FILENAME_CHARS);
  if (matches) {
    matches.forEach((char) => {
      // Show printable characters as-is, control chars as descriptions
      if (char.charCodeAt(0) < 0x20 || char.charCodeAt(0) >= 0x7f) {
        invalidChars.add("control character");
      } else {
        invalidChars.add(char);
      }
    });
    errors.push(
      `Invalid characters: ${Array.from(invalidChars).join(", ")}`,
    );
  }

  if (filename.length > DEFAULT_MAX_FILENAME_LENGTH) {
    errors.push(
      `Too long. (max ${DEFAULT_MAX_FILENAME_LENGTH})`,
    );
  }

  return errors;
}

/**
 * Gets a list of specific validation errors for a path (which may contain multiple path components)
 *
 * Unlike `getFilenameValidationErrors()`, this function allows:
 * - Forward slashes (/) as path separators
 * - ".." and "." as path components for directory traversal
 *
 * Each path component is validated for:
 * - Invalid characters (excluding /, which is allowed as separator)
 * - Maximum length per component
 * - Control characters
 *
 * @param path - The path to validate (e.g., "folder/file.txt" or "../parent/file.txt")
 * @returns Array of human-readable error messages (empty if valid)
 *
 * @example
 * getPathValidationErrors("folder/file.txt") // []
 * getPathValidationErrors("../parent/file.txt") // []
 * getPathValidationErrors("folder:name/file*.txt") // ["Component 'folder:name' contains invalid characters...", "Component 'file*.txt' contains invalid characters..."]
 * getPathValidationErrors("") // ["Path cannot be empty"]
 */
export function getPathValidationErrors(path: string): string[] {
  const errors: string[] = [];

  if (typeof path !== "string") {
    errors.push("Path must be a string");
    return errors;
  }

  if (path.length === 0) {
    errors.push("Path can't be empty");
    return errors;
  }

  const trimmed = path.trim();
  if (trimmed.length === 0) {
    errors.push("Path can't be only whitespace");
    return errors;
  }

  // Check total path length
  if (path.length > DEFAULT_MAX_PATH_LENGTH) {
    errors.push(
      `Path too long. (max ${DEFAULT_MAX_PATH_LENGTH})`,
    );
  }

  // Special case: "/" is a valid root path
  if (trimmed === "/") {
    return errors;
  }

  // Split path into components and validate each one
  // Note: normalize() is intentionally NOT called here because we want to validate
  // user input before any path resolution happens
  const components = path.split("/").filter((component) => component.length > 0);

  if (components.length === 0) {
    errors.push("Path needs at least one valid component");
    return errors;
  }

  // Validate each component
  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    // Allow "." and ".." for path traversal
    if (component === "." || component === "..") {
      continue;
    }

    // Check for invalid characters in this component
    // Use the same regex but allow this to be a path component
    const invalidChars = new Set<string>();
    const matches = component.match(INVALID_FILENAME_CHARS);
    if (matches) {
      matches.forEach((char) => {
        // Show printable characters as-is, control chars as descriptions
        if (char.charCodeAt(0) < 0x20 || char.charCodeAt(0) >= 0x7f) {
          invalidChars.add("control character");
        } else {
          invalidChars.add(char);
        }
      });
      errors.push(
        `'${component}' has invalid characters: ${Array.from(invalidChars).join(", ")}`,
      );
    }

    // Check component length
    if (component.length > DEFAULT_MAX_FILENAME_LENGTH) {
      errors.push(
        `'${component}' too long. (max ${DEFAULT_MAX_FILENAME_LENGTH})`,
      );
    }

    // Check that after trimming spaces, we still have a valid component
    const trimmedComponent = component.trim();
    if (trimmedComponent.length === 0) {
      errors.push(`Component ${i + 1} is only whitespace`);
    }
  }

  return errors;
}

/**
 * Sanitizes a filename by replacing invalid characters and enforcing length limits
 *
 * This function ensures filenames are safe for use across Linux, Windows, and macOS:
 * - Replaces invalid characters (/, \, :, *, ?, ", <, >, |, control chars) with specified replacement
 * - Strips leading and trailing spaces (but preserves periods for Unix dot files)
 * - Truncates to specified maximum length
 * - Rejects special directory names ("." and "..")
 * - Throws error if result would be empty
 *
 * @param filename - The filename to sanitize (without path)
 * @param replaceChar - Character to replace invalid characters with, or empty string to remove them (default: "_")
 * @param maxLength - Maximum filename length (default: 200)
 * @returns Sanitized filename safe for cross-platform use
 * @throws Error if sanitization results in an empty filename or "." or ".."
 *
 * @example
 * sanitizeFilename("my:file*name?.txt") // "my_file_name_.txt"
 * sanitizeFilename("my:file*name?.txt", "-") // "my-file-name-.txt"
 * sanitizeFilename("my:file*name?.txt", "") // "myfilename.txt" (removes invalid chars)
 * sanitizeFilename(".gitignore") // ".gitignore" (dot files preserved)
 * sanitizeFilename("  spaced  ") // "spaced"
 * sanitizeFilename(".") // throws Error (reserved directory name)
 * sanitizeFilename("..") // throws Error (reserved directory name)
 */
export function sanitizeFilename(
  filename: string,
  replaceChar: string = "_",
  maxLength: number = DEFAULT_MAX_FILENAME_LENGTH,
): string {
  if (typeof filename !== "string") {
    throw new Error("Filename must be a string");
  }

  if (typeof replaceChar !== "string" || replaceChar.length > 1) {
    throw new Error(
      "Replace char must be single character or empty",
    );
  }

  // Replace invalid characters with the specified replacement character
  let sanitized = filename.replace(INVALID_FILENAME_CHARS, replaceChar);

  // Strip leading and trailing spaces (but keep periods for dot files)
  sanitized = sanitized.trim();

  // Truncate to maximum length if needed
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    // Re-trim in case truncation left trailing spaces
    sanitized = sanitized.trim();
  }

  // Ensure we didn't end up with an empty string
  if (sanitized.length === 0) {
    throw new Error(
      "Filename empty after sanitizing (only had invalid chars or whitespace)",
    );
  }

  // Reject special directory names
  if (sanitized === "." || sanitized === "..") {
    throw new Error(
      'Filename can\'t be "." or ".." (reserved)',
    );
  }

  return sanitized;
}

/**
 * Sanitizes an entire path by sanitizing each component and preserving path structure
 *
 * This function:
 * - Normalizes the path before sanitization
 * - Sanitizes each path component for cross-platform safety
 * - Preserves leading slashes (absolute paths)
 * - Preserves trailing slashes (directory indicators)
 * - Can skip invalid components (for untrusted input) or throw errors (for user input)
 *
 * @param path - The path to sanitize (e.g., "/folder/file.txt" or "folder/subfolder/")
 * @param options - Configuration options
 * @param options.skipInvalid - If true, skip invalid components; if false, throw on invalid components (default: false)
 * @param options.replaceChar - Character to replace invalid characters with, or empty string to remove them (default: "_")
 * @param options.maxLength - Maximum length for each component (default: 200)
 * @param options.maxPathLength - Maximum length for the entire path (default: 255)
 * @returns Sanitized path with original slash structure preserved
 * @throws Error if any component is invalid and skipInvalid is false, or if path exceeds maxPathLength
 *
 * @example
 * sanitizePath("/folder:name/file*.txt") // "/folder_name/file_.txt"
 * sanitizePath("/folder:name/file*.txt", { replaceChar: "-" }) // "/folder-name/file-.txt"
 * sanitizePath("/folder:name/file*.txt", { replaceChar: "" }) // "/foldername/file.txt"
 * sanitizePath("folder/file.txt/") // "folder/file.txt/"
 * sanitizePath("folder/../file.txt", { skipInvalid: true }) // "folder/file.txt"
 * sanitizePath("folder/../file.txt") // throws Error
 */
export function sanitizePath(
  path: string,
  options: {
    skipInvalid?: boolean;
    replaceChar?: string;
    maxLength?: number;
    maxPathLength?: number;
  } = {},
): string {
  const {
    skipInvalid = false,
    replaceChar = "_",
    maxLength = DEFAULT_MAX_FILENAME_LENGTH,
    maxPathLength = DEFAULT_MAX_PATH_LENGTH,
  } = options;

  if (typeof path !== "string") {
    throw new Error("Path must be a string");
  }

  // Preserve leading and trailing slashes
  const hasLeadingSlash = path.startsWith("/");
  const hasTrailingSlash = path.length > 1 && path.endsWith("/");

  // Normalize the path first to resolve . and .. and clean up multiple slashes
  const normalized = normalize(path);

  // Split into components and filter out empty strings
  const components = normalized.split("/").filter((p) => p.length > 0);

  // Sanitize each component
  const sanitizedComponents: string[] = [];
  for (const component of components) {
    try {
      const sanitized = sanitizeFilename(component, replaceChar, maxLength);
      sanitizedComponents.push(sanitized);
    } catch (err) {
      if (skipInvalid) {
        // Skip this component if skipInvalid is enabled
        continue;
      } else {
        // Re-throw the error if we're in strict mode
        throw err;
      }
    }
  }

  // If all components were invalid and skipped, return appropriate empty path
  if (sanitizedComponents.length === 0) {
    if (hasLeadingSlash) {
      return "/";
    }
    throw new Error(
      "Path empty after sanitizing (all components invalid)",
    );
  }

  // Reconstruct the path with original slash structure
  let result = join(...sanitizedComponents);

  if (hasLeadingSlash && !result.startsWith("/")) {
    result = "/" + result;
  }

  if (hasTrailingSlash && !result.endsWith("/")) {
    result = result + "/";
  }

  // Validate total path length
  if (result.length > maxPathLength) {
    throw new Error(
      `Path too long after sanitizing: ${result.length} characters (max ${maxPathLength})`,
    );
  }

  return result;
}
