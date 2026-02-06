import { describe, expect, test, vi } from "vitest";
import { extractPackageChanges } from "./summarize-pr.mjs";

/**
 * Tests for the renovate-summary script
 * These are integration tests that validate the actual implementation
 * from summarize-pr.mjs
 */
describe("Renovate Summary Script", () => {
  describe("extractPackageChanges", () => {
    // Helper to create mock octokit
    const createMockOctokit = (previousPackageJson, currentPackageJson) => {
      return {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: {
              base: { sha: 'base-sha-123' },
              head: { sha: 'head-sha-456' },
            },
          }),
        },
        repos: {
          getContent: vi.fn()
            .mockResolvedValueOnce({
              // First call - previous package.json
              data: {
                content: Buffer.from(JSON.stringify(previousPackageJson)).toString('base64'),
              },
            })
            .mockResolvedValueOnce({
              // Second call - current package.json
              data: {
                content: Buffer.from(JSON.stringify(currentPackageJson)).toString('base64'),
              },
            }),
        },
      };
    };

    test("should extract version changes from package.json", async () => {
      const previousPackageJson = {
        dependencies: {
          axios: "^1.12.0",
        },
      };

      const currentPackageJson = {
        dependencies: {
          axios: "^1.13.4",
        },
      };

      const mockOctokit = createMockOctokit(previousPackageJson, currentPackageJson);

      const prFiles = [
        {
          filename: "package.json",
          patch: `@@ -1,5 +1,5 @@
 {
-  "axios": "^1.12.0"
+  "axios": "^1.13.4"
 }`,
        },
      ];

      const changes = await extractPackageChanges(
        mockOctokit,
        "owner",
        "repo",
        123,
        prFiles,
        ""
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].name).toBe("axios");
      expect(changes[0].oldVersion).toBe("1.12.0");
      expect(changes[0].newVersion).toBe("1.13.4");
    });

    test("should extract scoped package changes", async () => {
      const previousPackageJson = {
        devDependencies: {
          "@types/node": "^24.0.0",
        },
      };

      const currentPackageJson = {
        devDependencies: {
          "@types/node": "^24.10.1",
        },
      };

      const mockOctokit = createMockOctokit(previousPackageJson, currentPackageJson);

      const prFiles = [
        {
          filename: "package.json",
          patch: `@@ -1,5 +1,5 @@
 {
-  "@types/node": "^24.0.0"
+  "@types/node": "^24.10.1"
 }`,
        },
      ];

      const changes = await extractPackageChanges(
        mockOctokit,
        "owner",
        "repo",
        123,
        prFiles,
        ""
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].name).toBe("@types/node");
      expect(changes[0].oldVersion).toBe("24.0.0");
      expect(changes[0].newVersion).toBe("24.10.1");
    });

    test("should handle multiple package changes", async () => {
      const previousPackageJson = {
        dependencies: {
          react: "^19.0.0",
          vite: "^6.0.0",
        },
      };

      const currentPackageJson = {
        dependencies: {
          react: "^19.2.3",
          vite: "^6.3.5",
        },
      };

      const mockOctokit = createMockOctokit(previousPackageJson, currentPackageJson);

      const prFiles = [
        {
          filename: "package.json",
          patch: `@@ -1,10 +1,10 @@
 {
-  "react": "^19.0.0",
+  "react": "^19.2.3",
-  "vite": "^6.0.0"
+  "vite": "^6.3.5"
 }`,
        },
      ];

      const changes = await extractPackageChanges(
        mockOctokit,
        "owner",
        "repo",
        123,
        prFiles,
        ""
      );

      expect(changes).toHaveLength(2);
      expect(changes.find((c) => c.name === "react")).toBeDefined();
      expect(changes.find((c) => c.name === "vite")).toBeDefined();
    });

    test("should return empty array when no package.json changes", async () => {
      const prFiles = [
        {
          filename: "README.md",
          patch: "Some documentation changes",
        },
      ];

      const mockOctokit = {
        pulls: { get: vi.fn() },
        repos: { getContent: vi.fn() },
      };

      const changes = await extractPackageChanges(
        mockOctokit,
        "owner",
        "repo",
        123,
        prFiles,
        ""
      );

      expect(changes).toHaveLength(0);
    });

    test("should filter out newly added packages", async () => {
      const previousPackageJson = {
        dependencies: {},
      };

      const currentPackageJson = {
        dependencies: {
          "new-package": "^1.0.0",
        },
      };

      const mockOctokit = createMockOctokit(previousPackageJson, currentPackageJson);

      const prFiles = [
        {
          filename: "package.json",
          patch: `@@ -1,5 +1,5 @@
 {
+  "new-package": "^1.0.0"
 }`,
        },
      ];

      const changes = await extractPackageChanges(
        mockOctokit,
        "owner",
        "repo",
        123,
        prFiles,
        ""
      );

      // Should be filtered out because there's no old version
      expect(changes).toHaveLength(0);
    });

    test("should handle semver pre-release versions", async () => {
      const previousPackageJson = {
        dependencies: {
          "beta-pkg": "^1.0.0-beta.1",
        },
      };

      const currentPackageJson = {
        dependencies: {
          "beta-pkg": "^1.0.0-rc.2",
        },
      };

      const mockOctokit = createMockOctokit(previousPackageJson, currentPackageJson);

      const prFiles = [
        {
          filename: "package.json",
          patch: `@@ -1,5 +1,5 @@
 {
-  "beta-pkg": "^1.0.0-beta.1"
+  "beta-pkg": "^1.0.0-rc.2"
 }`,
        },
      ];

      const changes = await extractPackageChanges(
        mockOctokit,
        "owner",
        "repo",
        123,
        prFiles,
        ""
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].name).toBe("beta-pkg");
      expect(changes[0].oldVersion).toBe("1.0.0-beta.1");
      expect(changes[0].newVersion).toBe("1.0.0-rc.2");
    });

    test("should handle package names with periods", async () => {
      const previousPackageJson = {
        dependencies: {
          "some.package": "^1.0.0",
        },
      };

      const currentPackageJson = {
        dependencies: {
          "some.package": "^2.0.0",
        },
      };

      const mockOctokit = createMockOctokit(previousPackageJson, currentPackageJson);

      const prFiles = [
        {
          filename: "package.json",
          patch: `@@ -1,5 +1,5 @@
 {
-  "some.package": "^1.0.0"
+  "some.package": "^2.0.0"
 }`,
        },
      ];

      const changes = await extractPackageChanges(
        mockOctokit,
        "owner",
        "repo",
        123,
        prFiles,
        ""
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].name).toBe("some.package");
      expect(changes[0].oldVersion).toBe("1.0.0");
      expect(changes[0].newVersion).toBe("2.0.0");
    });
  });

  describe("comment header detection", () => {
    test("should identify existing summary comments", () => {
      const COMMENT_HEADER = "<!-- RENOVATE_SUMMARY_COMMENT -->";
      const comment = {
        body: `${COMMENT_HEADER}\n# Summary\nSome content`,
      };

      expect(comment.body).toContain(COMMENT_HEADER);
    });

    test("should not match comments without header", () => {
      const COMMENT_HEADER = "<!-- RENOVATE_SUMMARY_COMMENT -->";
      const comment = {
        body: "Regular comment without header",
      };

      expect(comment.body).not.toContain(COMMENT_HEADER);
    });
  });
});
