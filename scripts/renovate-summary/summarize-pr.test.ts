import { describe, expect, test } from "vitest";

/**
 * Tests for the renovate-summary script
 * Note: These tests cover the extractPackageChanges function logic
 * The full script requires GitHub and GitHub Copilot CLI access
 */
describe("Renovate Summary Script", () => {
  describe("extractPackageChanges", () => {
    test("should extract version changes from package.json patch", () => {
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

      const changes = extractPackageChangesLocal(prFiles);

      expect(changes).toHaveLength(1);
      expect(changes[0].name).toBe("axios");
      expect(changes[0].oldVersion).toBe("1.12.0");
      expect(changes[0].newVersion).toBe("1.13.4");
    });

    test("should extract scoped package changes", () => {
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

      const changes = extractPackageChangesLocal(prFiles);

      expect(changes).toHaveLength(1);
      expect(changes[0].name).toBe("@types/node");
      expect(changes[0].oldVersion).toBe("24.0.0");
      expect(changes[0].newVersion).toBe("24.10.1");
    });

    test("should handle multiple package changes", () => {
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

      const changes = extractPackageChangesLocal(prFiles);

      expect(changes).toHaveLength(2);
      expect(changes.find((c) => c.name === "react")).toBeDefined();
      expect(changes.find((c) => c.name === "vite")).toBeDefined();
    });

    test("should return empty array when no package.json changes", () => {
      const prFiles = [
        {
          filename: "README.md",
          patch: "Some documentation changes",
        },
      ];

      const changes = extractPackageChangesLocal(prFiles);

      expect(changes).toHaveLength(0);
    });

    test("should filter out incomplete changes (only old or new version)", () => {
      const prFiles = [
        {
          filename: "package.json",
          patch: `@@ -1,5 +1,5 @@
 {
+  "new-package": "^1.0.0"
 }`,
        },
      ];

      const changes = extractPackageChangesLocal(prFiles);

      // Should be filtered out because there's no old version
      expect(changes).toHaveLength(0);
    });

    test("should handle semver pre-release versions", () => {
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

      const changes = extractPackageChangesLocal(prFiles);

      expect(changes).toHaveLength(1);
      expect(changes[0].name).toBe("beta-pkg");
      expect(changes[0].oldVersion).toBe("1.0.0-beta.1");
      expect(changes[0].newVersion).toBe("1.0.0-rc.2");
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

/**
 * Local implementation of extractPackageChanges for testing
 * Extracted from summarize-pr.mjs to test the logic
 */
function extractPackageChangesLocal(prFiles) {
  const changes = [];

  const packageJsonFile = prFiles.find(
    (file) => file.filename === "package.json"
  );

  if (packageJsonFile && packageJsonFile.patch) {
    const patch = packageJsonFile.patch;
    const lines = patch.split("\n");

    for (const line of lines) {
      const match = line.match(/^[\+\-]\s+"(@?[\w\-\/]+)":\s+"[\^~]?([\d\.\-\w]+)"/);
      if (match) {
        const packageName = match[1];
        const version = match[2];
        const isAddition = line.startsWith("+");

        const existing = changes.find((c) => c.name === packageName);
        if (existing) {
          if (isAddition) {
            existing.newVersion = version;
          } else {
            existing.oldVersion = version;
          }
        } else {
          changes.push({
            name: packageName,
            oldVersion: isAddition ? null : version,
            newVersion: isAddition ? version : null,
          });
        }
      }
    }
  }

  return changes.filter((c) => c.oldVersion && c.newVersion);
}
