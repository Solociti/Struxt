import { describe, expect, it } from "vitest";
import { reWriteAssetPath } from "./reWriteAssetPath";

describe("reWriteAssetPath", () => {
  describe("basic path rewriting", () => {
    it("should rewrite paths between folders with various structures", () => {
      expect(
        reWriteAssetPath("/old/folder/file.txt", "/old/folder", "/new/folder"),
      ).toBe("/new/folder/file.txt");
      expect(
        reWriteAssetPath(
          "/old/folder/sub/file.txt",
          "/old/folder",
          "/new/folder",
        ),
      ).toBe("/new/folder/sub/file.txt");
      expect(
        reWriteAssetPath("old/folder/file.txt", "old/folder", "new/folder"),
      ).toBe("new/folder/file.txt");
      expect(
        reWriteAssetPath("/folder/file.txt", "/folder", "/deep/nested/folder"),
      ).toBe("/deep/nested/folder/file.txt");
      expect(
        reWriteAssetPath(
          "/deep/nested/folder/file.txt",
          "/deep/nested/folder",
          "/shallow",
        ),
      ).toBe("/shallow/file.txt");
    });

    it("should handle root path as source or destination", () => {
      expect(reWriteAssetPath("/old/folder/file.txt", "/old/folder", "/")).toBe(
        "/file.txt",
      );
      expect(reWriteAssetPath("/file.txt", "/", "/new/folder")).toBe(
        "/new/folder/file.txt",
      );
    });
  });

  describe("trailing slash preservation", () => {
    it("should preserve trailing slash on directories but not add to files", () => {
      expect(
        reWriteAssetPath(
          "/old/folder/subfolder/",
          "/old/folder",
          "/new/folder",
        ),
      ).toBe("/new/folder/subfolder/");
      expect(
        reWriteAssetPath(
          "/old/folder/sub1/sub2/",
          "/old/folder",
          "/new/folder",
        ),
      ).toBe("/new/folder/sub1/sub2/");
      expect(
        reWriteAssetPath("/old/folder/file.txt", "/old/folder", "/new/folder"),
      ).toBe("/new/folder/file.txt");
    });
  });

  describe("path normalization and sanitization", () => {
    it("should sanitize invalid characters in paths", () => {
      expect(reWriteAssetPath("/old/file.txt", "/old", "/new:folder")).toBe(
        "/new_folder/file.txt",
      );
      expect(
        reWriteAssetPath("/old/sub/file.txt", "/old", "/new*/folder?"),
      ).toBe("/new_/folder_/sub/file.txt");
      expect(reWriteAssetPath("/old/my<file>.txt", "/old", "/new")).toBe(
        "/new/my_file_.txt",
      );
    });

    it("should normalize multiple slashes and dot references", () => {
      expect(
        reWriteAssetPath(
          "/old//folder///file.txt",
          "/old/folder",
          "/new/folder",
        ),
      ).toBe("/new/folder/file.txt");
      expect(
        reWriteAssetPath(
          "/old/./folder/file.txt",
          "/old/folder",
          "/new/folder",
        ),
      ).toBe("/new/folder/file.txt");
      expect(reWriteAssetPath("/old/sub/../file.txt", "/old", "/new")).toBe(
        "/new/file.txt",
      );
    });
  });

  describe("same path scenarios", () => {
    it("should handle rewriting to the same base path", () => {
      expect(reWriteAssetPath("/folder/file.txt", "/folder", "/folder")).toBe(
        "/folder/file.txt",
      );
      expect(
        reWriteAssetPath("/folder/a/b/c/file.txt", "/folder", "/folder"),
      ).toBe("/folder/a/b/c/file.txt");
    });
  });

  describe("complex scenarios", () => {
    it("should handle special characters and Unicode in paths", () => {
      expect(
        reWriteAssetPath("/old/folder.name/file.txt", "/old", "/new"),
      ).toBe("/new/folder.name/file.txt");
      expect(
        reWriteAssetPath("/old/my folder/my file.txt", "/old", "/new"),
      ).toBe("/new/my folder/my file.txt");
      expect(reWriteAssetPath("/old/文件夹/文件.txt", "/old", "/new")).toBe(
        "/new/文件夹/文件.txt",
      );
      expect(reWriteAssetPath("/old/folder*/", "/old", "/new:base")).toBe(
        "/new_base/folder_/",
      );
    });

    it("should handle real-world project restructuring", () => {
      expect(
        reWriteAssetPath(
          "/folder/file.txt",
          "/folder/file.txt",
          "/other/newfile.txt",
        ),
      ).toBe("/other/newfile.txt");
      expect(
        reWriteAssetPath(
          "/projects/project1/assets/image.png",
          "/projects/project1",
          "/projects/project2",
        ),
      ).toBe("/projects/project2/assets/image.png");
      expect(
        reWriteAssetPath(
          "/projects/2024/client/src/assets/images/logo.png",
          "/projects/2024/client",
          "/archive/old-client",
        ),
      ).toBe("/archive/old-client/src/assets/images/logo.png");
    });
  });

  describe("edge cases", () => {
    it("should handle minimal and single-character paths", () => {
      expect(reWriteAssetPath("/old/file.txt", "/old", "/new")).toBe(
        "/new/file.txt",
      );
      expect(reWriteAssetPath("/a/b/c.txt", "/a/b", "/x/y")).toBe("/x/y/c.txt");
      expect(
        reWriteAssetPath("/old/folder/file.txt", "/old/folder/file.txt", "/"),
      ).toBe("/");
    });
  });
});
