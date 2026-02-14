import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_FILENAME_LENGTH,
  getFilenameValidationErrors,
  getPathValidationErrors,
  isValidFilename,
  sanitizeFilename,
  sanitizePath,
} from "./sanitizeFilename";

describe("sanitizeFilename", () => {
  describe("sanitizeFilename()", () => {
    it("should preserve valid filenames", () => {
      expect(sanitizeFilename("normal-file_name.txt")).toBe(
        "normal-file_name.txt",
      );
      expect(sanitizeFilename("file123.pdf")).toBe("file123.pdf");
      expect(sanitizeFilename("my.file.with.dots.js")).toBe(
        "my.file.with.dots.js",
      );
    });

    it("should replace invalid path characters with underscore", () => {
      expect(sanitizeFilename("path/to/file.txt")).toBe("path_to_file.txt");
      expect(sanitizeFilename("path\\to\\file.txt")).toBe("path_to_file.txt");
      expect(sanitizeFilename("C:file.txt")).toBe("C_file.txt");
      expect(sanitizeFilename("file*.txt")).toBe("file_.txt");
      expect(sanitizeFilename("file?.txt")).toBe("file_.txt");
      expect(sanitizeFilename('file"name".txt')).toBe("file_name_.txt");
      expect(sanitizeFilename("file<name.txt")).toBe("file_name.txt");
      expect(sanitizeFilename("file>name.txt")).toBe("file_name.txt");
      expect(sanitizeFilename("file|name.txt")).toBe("file_name.txt");
    });

    it("should replace multiple invalid characters", () => {
      expect(sanitizeFilename("test::<>|file*name?.txt")).toBe(
        "test_____file_name_.txt", // 5 invalid chars: : : < > |
      );
    });

    it("should replace null byte with underscore", () => {
      expect(sanitizeFilename("file\x00name.txt")).toBe("file_name.txt");
    });

    it("should replace control characters with underscore", () => {
      expect(sanitizeFilename("file\x01\x02\x03name.txt")).toBe(
        "file___name.txt",
      );
      expect(sanitizeFilename("file\x1Fname.txt")).toBe("file_name.txt");
      expect(sanitizeFilename("file\x7Fname.txt")).toBe("file_name.txt");
      expect(sanitizeFilename("file\x9Fname.txt")).toBe("file_name.txt");
    });

    it("should strip leading and trailing spaces", () => {
      expect(sanitizeFilename("  file.txt")).toBe("file.txt");
      expect(sanitizeFilename("file.txt  ")).toBe("file.txt");
      expect(sanitizeFilename("  file.txt  ")).toBe("file.txt");
      // Tabs are control characters \x09 and get replaced with _ before trimming
      expect(sanitizeFilename("   \tfile.txt")).toBe("_file.txt");
      expect(sanitizeFilename("file.txt   \t")).toBe("file.txt   _");
    });

    it("should preserve internal spaces", () => {
      expect(sanitizeFilename("my file name.txt")).toBe("my file name.txt");
      expect(sanitizeFilename("file  with   spaces.txt")).toBe(
        "file  with   spaces.txt",
      );
    });

    it("should preserve periods in filenames", () => {
      expect(sanitizeFilename(".gitignore")).toBe(".gitignore");
      expect(sanitizeFilename(".env")).toBe(".env");
      expect(sanitizeFilename("file.")).toBe("file.");
      expect(sanitizeFilename("name.txt.")).toBe("name.txt.");
      expect(sanitizeFilename("file.name.txt")).toBe("file.name.txt");
      expect(sanitizeFilename("my.long.file.name.tar.gz")).toBe(
        "my.long.file.name.tar.gz",
      );
      // But not the special directory names
      expect(() => sanitizeFilename(".")).toThrow("reserved");
      expect(() => sanitizeFilename("..")).toThrow("reserved");
    });

    it("should truncate filenames longer than default max (255)", () => {
      const longName = "a".repeat(300);
      const result = sanitizeFilename(longName);
      expect(result.length).toBe(DEFAULT_MAX_FILENAME_LENGTH);
      expect(result).toBe("a".repeat(255));
    });

    it("should truncate filenames to custom max length", () => {
      const longName = "a".repeat(150);
      const result = sanitizeFilename(longName, "_", 100);
      expect(result.length).toBe(100);
      expect(result).toBe("a".repeat(100));
    });

    it("should trim after truncation", () => {
      const nameWithSpaces = "test" + " ".repeat(260);
      const result = sanitizeFilename(nameWithSpaces);
      expect(result).toBe("test");
      expect(result.length).toBe(4);
    });

    it("should throw error for empty or whitespace-only filename", () => {
      expect(() => sanitizeFilename("")).toThrow(
        "Filename empty after sanitizing",
      );
      expect(() => sanitizeFilename("   ")).toThrow(
        "Filename empty after sanitizing",
      );
      // Tabs and newlines are control chars that get replaced, then trimmed
      // \t\n becomes __ which doesn't get trimmed away, so doesn't throw
      expect(sanitizeFilename("\t\n")).toBe("__");
    });

    it("should throw error for dot directory names", () => {
      expect(() => sanitizeFilename(".")).toThrow("reserved");
      expect(() => sanitizeFilename("..")).toThrow("reserved");
      // If a filename was only "." or ".." with spaces
      expect(() => sanitizeFilename(" . ")).toThrow("reserved");
      expect(() => sanitizeFilename(" .. ")).toThrow("reserved");
    });

    it("should throw error for filename with only invalid characters", () => {
      // Slashes get replaced with _ which doesn't throw
      expect(sanitizeFilename("////")).toBe("____");
      expect(sanitizeFilename("***???")).toBe("______");
      // Null bytes are control chars that get replaced
      expect(sanitizeFilename("\x00\x01\x02")).toBe("___");
    });

    it("should throw error for non-string input", () => {
      expect(() => sanitizeFilename(null as any)).toThrow(
        "Filename must be a string",
      );
      expect(() => sanitizeFilename(undefined as any)).toThrow(
        "Filename must be a string",
      );
      expect(() => sanitizeFilename(123 as any)).toThrow(
        "Filename must be a string",
      );
    });

    it("should preserve Unicode characters", () => {
      expect(sanitizeFilename("файл.txt")).toBe("файл.txt"); // Cyrillic
      expect(sanitizeFilename("文件.txt")).toBe("文件.txt"); // Chinese
      expect(sanitizeFilename("αρχείο.txt")).toBe("αρχείο.txt"); // Greek
      expect(sanitizeFilename("café.txt")).toBe("café.txt"); // Accented
      expect(sanitizeFilename("😀emoji.txt")).toBe("😀emoji.txt"); // Emoji
    });

    it("should handle filenames with multiple extensions", () => {
      expect(sanitizeFilename("archive.tar.gz")).toBe("archive.tar.gz");
      expect(sanitizeFilename("backup.2024.tar.bz2")).toBe(
        "backup.2024.tar.bz2",
      );
    });

    it("should handle edge case with spaces and invalid chars", () => {
      expect(sanitizeFilename("  file:name  ")).toBe("file_name");
      // Tabs and newlines are control chars that get replaced, then outer spaces trimmed
      expect(sanitizeFilename(" \tfile*/name? \n")).toBe("_file__name_ _");
    });

    it("should use custom replacement character", () => {
      expect(sanitizeFilename("file:name.txt", "-")).toBe("file-name.txt");
      expect(sanitizeFilename("path/to/file.txt", "-")).toBe(
        "path-to-file.txt",
      );
      expect(sanitizeFilename("file*?.txt", "+")).toBe("file++.txt");
      expect(sanitizeFilename("test::<>|file*name?.txt", "-")).toBe(
        "test-----file-name-.txt",
      );
    });

    it("should use custom replacement character with max length", () => {
      const longName = "a".repeat(150);
      const result = sanitizeFilename(longName, "-", 100);
      expect(result.length).toBe(100);
      expect(result).toBe("a".repeat(100));
    });

    it("should throw error for invalid replacement character", () => {
      expect(() => sanitizeFilename("file.txt", "ab")).toThrow(
        "Replace char must be single character or empty",
      );
      expect(() => sanitizeFilename("file.txt", 123 as any)).toThrow(
        "Replace char must be single character or empty",
      );
    });

    it("should remove invalid characters when replaceChar is empty string", () => {
      expect(sanitizeFilename("file:name.txt", "")).toBe("filename.txt");
      expect(sanitizeFilename("path/to/file.txt", "")).toBe("pathtofile.txt");
      expect(sanitizeFilename("file*?.txt", "")).toBe("file.txt");
      expect(sanitizeFilename("test::<>|file*name?.txt", "")).toBe(
        "testfilename.txt",
      );
      expect(sanitizeFilename(".pd<f", "")).toBe(".pdf");
    });

    it("should preserve periods with custom replacement character", () => {
      expect(sanitizeFilename(".gitignore", "-")).toBe(".gitignore");
      expect(sanitizeFilename("file*.tar.gz", "-")).toBe("file-.tar.gz");
      // But still reject special directory names
      expect(() => sanitizeFilename(".", "-")).toThrow("reserved");
      expect(() => sanitizeFilename("..", "+")).toThrow("reserved");
    });
  });

  describe("isValidFilename()", () => {
    it("should return true for valid filenames", () => {
      expect(isValidFilename("file.txt")).toBe(true);
      expect(isValidFilename("normal-file_name.txt")).toBe(true);
      expect(isValidFilename(".gitignore")).toBe(true);
      expect(isValidFilename("my file.txt")).toBe(true);
    });

    it("should return false for filenames with invalid characters", () => {
      expect(isValidFilename("file/name.txt")).toBe(false);
      // Backslash is only invalid on Windows, but we check for cross-platform safety
      expect(isValidFilename("file\\name.txt")).toBe(false);
      expect(isValidFilename("file:name.txt")).toBe(false);
      expect(isValidFilename("file*name.txt")).toBe(false);
      expect(isValidFilename("file?name.txt")).toBe(false);
      expect(isValidFilename('file"name.txt')).toBe(false);
      expect(isValidFilename("file<name.txt")).toBe(false);
      expect(isValidFilename("file>name.txt")).toBe(false);
      expect(isValidFilename("file|name.txt")).toBe(false);
    });

    it("should return false for filenames with control characters", () => {
      expect(isValidFilename("file\x00name.txt")).toBe(false);
      expect(isValidFilename("file\x01name.txt")).toBe(false);
      expect(isValidFilename("file\x1Fname.txt")).toBe(false);
    });

    it("should return false for empty, whitespace, or special names", () => {
      expect(isValidFilename("")).toBe(false);
      expect(isValidFilename("   ")).toBe(false);
      expect(isValidFilename("\t\n")).toBe(false);
      expect(isValidFilename(".")).toBe(false);
      expect(isValidFilename("..")).toBe(false);
    });

    it("should return false for filenames exceeding max length", () => {
      const longName = "a".repeat(256);
      expect(isValidFilename(longName)).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(isValidFilename(null as any)).toBe(false);
      expect(isValidFilename(undefined as any)).toBe(false);
      expect(isValidFilename(123 as any)).toBe(false);
    });
  });

  describe("getFilenameValidationErrors()", () => {
    it("should return empty array for valid filenames", () => {
      expect(getFilenameValidationErrors("file.txt")).toEqual([]);
      expect(getFilenameValidationErrors("normal-file_name.txt")).toEqual([]);
      expect(getFilenameValidationErrors(".gitignore")).toEqual([]);
    });

    it("should return error for empty, whitespace, or special names", () => {
      const emptyErrors = getFilenameValidationErrors("");
      expect(emptyErrors).toContain("Filename can't be empty");

      const whitespaceErrors = getFilenameValidationErrors("   ");
      expect(whitespaceErrors).toContain("Filename can't be only whitespace");

      const dotErrors = getFilenameValidationErrors(".");
      expect(dotErrors.some((e) => e.includes('"."'))).toBe(true);

      const doubleDotErrors = getFilenameValidationErrors("..");
      expect(doubleDotErrors.some((e) => e.includes('".."'))).toBe(true);
    });

    it("should return error for invalid characters", () => {
      const errors = getFilenameValidationErrors("file/name.txt");
      expect(errors.some((e) => e.includes("Invalid characters"))).toBe(true);
      expect(errors.some((e) => e.includes("/"))).toBe(true);
    });

    it("should return error for multiple invalid characters", () => {
      const errors = getFilenameValidationErrors("file:*?.txt");
      expect(errors.some((e) => e.includes("Invalid characters"))).toBe(true);
      expect(errors.some((e) => e.includes(":"))).toBe(true);
      expect(errors.some((e) => e.includes("*"))).toBe(true);
      expect(errors.some((e) => e.includes("?"))).toBe(true);
    });

    it("should return error for control characters", () => {
      const errors = getFilenameValidationErrors("file\x00name.txt");
      expect(errors.some((e) => e.includes("control character"))).toBe(true);
    });

    it("should return error for filename too long", () => {
      const longName = "a".repeat(256);
      const errors = getFilenameValidationErrors(longName);
      expect(errors.some((e) => e.includes("Too long"))).toBe(true);
      expect(errors.some((e) => e.includes("255"))).toBe(true);
    });

    it("should return multiple errors for multiple issues", () => {
      const longName = "file/name" + "a".repeat(250);
      const errors = getFilenameValidationErrors(longName);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors.some((e) => e.includes("Invalid characters"))).toBe(true);
      expect(errors.some((e) => e.includes("Too long"))).toBe(true);
    });

    it("should return error for non-string input", () => {
      const errors = getFilenameValidationErrors(null as any);
      expect(errors).toContain("Filename must be a string");
    });

    it("should not include duplicate character types", () => {
      const errors = getFilenameValidationErrors("file///name");
      expect(errors.length).toBe(1); // Only one error about invalid characters
      // Should not list "/" three times
      const errorText = errors[0];
      const slashCount = (errorText.match(/\//g) || []).length;
      expect(slashCount).toBe(1); // "/" should appear only once in the error
    });
  });

  describe("getPathValidationErrors()", () => {
    it("should return empty array for valid paths", () => {
      expect(getPathValidationErrors("file.txt")).toEqual([]);
      expect(getPathValidationErrors("folder/file.txt")).toEqual([]);
      expect(getPathValidationErrors("folder/subfolder/file.txt")).toEqual([]);
      expect(getPathValidationErrors("/absolute/path/file.txt")).toEqual([]);
    });

    it("should allow path traversal with .. and .", () => {
      expect(getPathValidationErrors("../file.txt")).toEqual([]);
      expect(getPathValidationErrors("../parent/file.txt")).toEqual([]);
      expect(getPathValidationErrors("./current/file.txt")).toEqual([]);
      expect(getPathValidationErrors("folder/../file.txt")).toEqual([]);
      expect(getPathValidationErrors("../../grandparent/file.txt")).toEqual([]);
    });

    it("should allow paths with dot files", () => {
      expect(getPathValidationErrors(".gitignore")).toEqual([]);
      expect(getPathValidationErrors("folder/.env")).toEqual([]);
      expect(getPathValidationErrors(".config/settings.json")).toEqual([]);
    });

    it("should return error for empty path", () => {
      const errors = getPathValidationErrors("");
      expect(errors).toContain("Path can't be empty");
    });

    it("should return error for whitespace-only path", () => {
      const errors = getPathValidationErrors("   ");
      expect(errors).toContain("Path can't be only whitespace");
    });

    it("should return error for path with only slashes", () => {
      const errors = getPathValidationErrors("///");
      expect(
        errors.some((e) => e.includes("needs at least one valid component")),
      ).toBe(true);
    });

    it("should return errors for invalid characters in path components", () => {
      const errors = getPathValidationErrors("folder:name/file*.txt");
      expect(errors.length).toBe(2); // Two components with errors
      expect(errors.some((e) => e.includes("folder:name"))).toBe(true);
      expect(errors.some((e) => e.includes("file*.txt"))).toBe(true);
      expect(errors.some((e) => e.includes(":"))).toBe(true);
      expect(errors.some((e) => e.includes("*"))).toBe(true);
    });

    it("should identify which component has the error", () => {
      const errors = getPathValidationErrors("valid/folder:name/valid.txt");
      expect(errors.length).toBe(1); // Only one component with error
      expect(errors[0]).toContain("folder:name");
      expect(errors[0]).toContain(":");
    });

    it("should return error for control characters in components", () => {
      const errors = getPathValidationErrors("folder/file\x00name.txt");
      expect(errors.some((e) => e.includes("control character"))).toBe(true);
    });

    it("should return error for component too long", () => {
      const longComponent = "a".repeat(256);
      const errors = getPathValidationErrors(
        `folder/${longComponent}/file.txt`,
      );
      expect(errors.some((e) => e.includes("too long"))).toBe(true);
    });

    it("should return error for whitespace-only component", () => {
      const errors = getPathValidationErrors("folder/   /file.txt");
      expect(errors.some((e) => e.includes("is only whitespace"))).toBe(true);
    });

    it("should handle backslashes (Windows paths)", () => {
      // Backslashes are invalid in path components (even though they're path separators on Windows)
      const errors = getPathValidationErrors("folder\\file.txt");
      expect(errors.some((e) => e.includes("\\"))).toBe(true);
    });

    it("should return multiple errors for multiple invalid components", () => {
      const errors = getPathValidationErrors(
        "folder:name/file*.txt/invalid?name",
      );
      expect(errors.length).toBe(3); // Three components with errors
    });

    it("should return error for non-string input", () => {
      const errors = getPathValidationErrors(null as any);
      expect(errors).toContain("Path must be a string");
    });

    it("should not deduplicate character types per component", () => {
      // Each component should have its own error listing its invalid chars
      const errors = getPathValidationErrors("file:name/other:name");
      expect(errors.length).toBe(2);
      expect(errors[0]).toContain("file:name");
      expect(errors[1]).toContain("other:name");
    });

    it("should handle trailing slashes gracefully", () => {
      expect(getPathValidationErrors("folder/")).toEqual([]);
      expect(getPathValidationErrors("folder/subfolder/")).toEqual([]);
    });

    it("should handle leading slashes gracefully", () => {
      expect(getPathValidationErrors("/folder/file.txt")).toEqual([]);
      expect(getPathValidationErrors("/")).toEqual([]);
    });
  });

  describe("sanitizePath()", () => {
    it("should sanitize simple relative paths", () => {
      expect(sanitizePath("folder/file.txt")).toBe("folder/file.txt");
      expect(sanitizePath("folder/subfolder/file.txt")).toBe(
        "folder/subfolder/file.txt",
      );
    });

    it("should sanitize absolute paths and preserve leading slash", () => {
      expect(sanitizePath("/file.txt")).toBe("/file.txt");
      expect(sanitizePath("/folder/file.txt")).toBe("/folder/file.txt");
      expect(sanitizePath("/folder/subfolder/file.txt")).toBe(
        "/folder/subfolder/file.txt",
      );
    });

    it("should preserve trailing slash for directories", () => {
      expect(sanitizePath("folder/")).toBe("folder/");
      expect(sanitizePath("/folder/subfolder/")).toBe("/folder/subfolder/");
      expect(sanitizePath("folder/subfolder/")).toBe("folder/subfolder/");
    });

    it("should sanitize invalid characters in path components", () => {
      expect(sanitizePath("folder:name/file*.txt")).toBe(
        "folder_name/file_.txt",
      );
      expect(sanitizePath("/folder?/file|.txt")).toBe("/folder_/file_.txt");
      expect(sanitizePath('folder"/file<name>.txt')).toBe(
        "folder_/file_name_.txt",
      );
    });

    it("should normalize paths before sanitization", () => {
      expect(sanitizePath("folder//file.txt")).toBe("folder/file.txt");
      expect(sanitizePath("folder///subfolder/file.txt")).toBe(
        "folder/subfolder/file.txt",
      );
      expect(sanitizePath("/folder//file.txt")).toBe("/folder/file.txt");
    });

    it("should handle paths with . correctly", () => {
      expect(sanitizePath("folder/./file.txt")).toBe("folder/file.txt");
      expect(sanitizePath("./folder/file.txt")).toBe("folder/file.txt");
    });

    it("should handle .. correctly (normalize resolves them when possible)", () => {
      // normalize() resolves .. when there's a parent to go up to
      expect(sanitizePath("folder/../file.txt")).toBe("file.txt");
      expect(sanitizePath("/folder/../file.txt")).toBe("/file.txt");

      // But throws when .. can't be resolved (at start of relative path)
      expect(() => sanitizePath("../file.txt")).toThrow("reserved");
      expect(() => sanitizePath("../..")).toThrow("reserved");

      // Absolute path with .. at root resolves beyond root to just root
      expect(sanitizePath("/../file.txt")).toBe("/file.txt");
    });

    it("should skip invalid components when skipInvalid is true", () => {
      // skipInvalid allows paths with unresolvable .. to skip those components
      expect(sanitizePath("../file.txt", { skipInvalid: true })).toBe(
        "file.txt",
      );
      expect(sanitizePath("../folder/file.txt", { skipInvalid: true })).toBe(
        "folder/file.txt",
      );

      // When normalize CAN resolve .., it does (so no need for skipInvalid)
      expect(sanitizePath("folder/../file.txt", { skipInvalid: true })).toBe(
        "file.txt",
      );
      expect(
        sanitizePath("/folder/../subfolder/file.txt", { skipInvalid: true }),
      ).toBe("/subfolder/file.txt");
    });

    it("should handle root and single component paths", () => {
      expect(sanitizePath("/")).toBe("/");
      expect(sanitizePath("file.txt")).toBe("file.txt");
      expect(sanitizePath("folder/")).toBe("folder/");
    });

    it("should sanitize each component independently", () => {
      expect(sanitizePath("fold:er/sub*folder/fi|le.txt")).toBe(
        "fold_er/sub_folder/fi_le.txt",
      );
    });

    it("should handle hidden files (dot files) in paths", () => {
      expect(sanitizePath("folder/.gitignore")).toBe("folder/.gitignore");
      expect(sanitizePath("/home/user/.bashrc")).toBe("/home/user/.bashrc");
      expect(sanitizePath(".config/app.json")).toBe(".config/app.json");
    });

    it("should handle invalid components with skipInvalid option", () => {
      expect(() => sanitizePath("../..")).toThrow();
      expect(sanitizePath("/../..", { skipInvalid: true })).toBe("/");
      expect(() => sanitizePath("../..", { skipInvalid: true })).toThrow(
        "Path empty after sanitizing",
      );
    });

    it("should apply maxLength to each component", () => {
      const longComponent = "a".repeat(100);
      const result = sanitizePath(`folder/${longComponent}/file.txt`, {
        maxLength: 50,
      });
      expect(result).toBe(`folder/${"a".repeat(50)}/file.txt`);
    });

    it("should handle paths with control characters", () => {
      expect(sanitizePath("fold\x00er/fi\x01le.txt")).toBe("fold_er/fi_le.txt");
    });

    it("should handle Windows-style paths", () => {
      // Backslashes are invalid chars and get replaced with underscores
      expect(sanitizePath("folder\\file.txt")).toBe("folder_file.txt");
      expect(sanitizePath("C:\\folder\\file.txt")).toBe("C__folder_file.txt");
    });

    it("should throw for empty, whitespace, or non-string input", () => {
      // Empty string normalizes to ".", which is a reserved directory name
      expect(() => sanitizePath("")).toThrow("reserved");
      expect(() => sanitizePath("   ")).toThrow();
      expect(() => sanitizePath(null as any)).toThrow("Path must be a string");
      expect(() => sanitizePath(undefined as any)).toThrow(
        "Path must be a string",
      );
    });

    it("should preserve structure in complex paths", () => {
      expect(sanitizePath("/public/assets/user:files/document*.pdf")).toBe(
        "/public/assets/user_files/document_.pdf",
      );
    });

    it("should handle mixed valid and invalid components with skipInvalid", () => {
      // normalize() resolves .. and . where possible, so this becomes "valid/file.txt"
      expect(
        sanitizePath("folder/../valid/./another/../file.txt", {
          skipInvalid: true,
        }),
      ).toBe("valid/file.txt");
    });

    it("should use custom replacement character", () => {
      expect(sanitizePath("folder:name/file*.txt", { replaceChar: "-" })).toBe(
        "folder-name/file-.txt",
      );
      expect(sanitizePath("/folder?/file|.txt", { replaceChar: "+" })).toBe(
        "/folder+/file+.txt",
      );
      expect(sanitizePath('folder"/file<name>.txt', { replaceChar: "~" })).toBe(
        "folder~/file~name~.txt",
      );
    });

    it("should combine custom replacement character with other options", () => {
      const longComponent = "a:".repeat(50);
      const result = sanitizePath(`folder/${longComponent}/file.txt`, {
        replaceChar: "-",
        maxLength: 50,
      });
      expect(result).toBe(`folder/${"a-".repeat(25)}/file.txt`);
    });

    it("should use custom replacement character with skipInvalid", () => {
      expect(
        sanitizePath("../folder:name/file*.txt", {
          skipInvalid: true,
          replaceChar: "-",
        }),
      ).toBe("folder-name/file-.txt");
    });

    it("should remove invalid characters when replaceChar is empty string", () => {
      expect(sanitizePath("folder:name/file*.txt", { replaceChar: "" })).toBe(
        "foldername/file.txt",
      );
      expect(sanitizePath("/folder?/file|.txt", { replaceChar: "" })).toBe(
        "/folder/file.txt",
      );
      expect(sanitizePath('folder"/file<name>.txt/', { replaceChar: "" })).toBe(
        "folder/filename.txt/",
      );
    });
  });
});
