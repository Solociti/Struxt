import {
  isChildDir,
  validateMoveLocation,
} from "common/path/validateMoveLocation";
import { describe, expect, it } from "vitest";

describe("isChildDir", () => {
  it("should return true when child is nested in parent", () => {
    expect(isChildDir("/parent", "/parent/child")).toBe(true);
    expect(isChildDir("/a/b", "/a/b/c/d")).toBe(true);
  });

  it("should return false when child is not nested in parent", () => {
    expect(isChildDir("/parent", "/other")).toBe(false);
    expect(isChildDir("/a/b", "/a/c")).toBe(false);
  });

  it("should return false when paths are equal", () => {
    expect(isChildDir("/parent", "/parent")).toBe(false);
    expect(isChildDir("/parent/", "/parent/")).toBe(false);
  });

  it("should return false when parent is longer than child", () => {
    expect(isChildDir("/parent/child", "/parent")).toBe(false);
  });

  it("should return false for relative paths", () => {
    // Assuming isAbsolute checks for leading slash
    expect(isChildDir("parent", "parent/child")).toBe(false);
    expect(isChildDir("/parent", "child")).toBe(false);
  });
});

describe("validateMoveLocation", () => {
  it("should return valid for valid move", () => {
    const result = validateMoveLocation(
      "/source/folder",
      "/destination/folder",
    );
    expect(result.isValid).toBe(true);
    expect(result.warningMessage).toBe("");
  });

  it("should fail if destination is empty", () => {
    const result = validateMoveLocation("/source", "");
    expect(result.isValid).toBe(false);
  });

  it("should fail if paths are not absolute", () => {
    let result = validateMoveLocation("source", "/dest");
    expect(result.isValid).toBe(false);
    expect(result.warningMessage).toContain("must be absolute");

    result = validateMoveLocation("/source", "dest");
    expect(result.isValid).toBe(false);
  });

  it("should fail if source and destination are the same", () => {
    const result = validateMoveLocation("/same/path", "/same/path");
    expect(result.isValid).toBe(false);
    expect(result.warningMessage).toContain("same directory");
  });

  it("should fail if destination is a child of source", () => {
    const result = validateMoveLocation("/parent", "/parent/child");
    expect(result.isValid).toBe(false);
    expect(result.warningMessage).toContain("sub-directory");
  });

  it("should allow moving to a parent directory", () => {
    const result = validateMoveLocation("/a/b/c", "/a/b");
    expect(result.isValid).toBe(true);
  });

  it("should allow moving to a sibling directory", () => {
    const result = validateMoveLocation("/a/b", "/a/c");
    expect(result.isValid).toBe(true);
  });

  it("should detect same directory after normalization", () => {
    const result = validateMoveLocation("/a/b", "/a/c/../b");
    expect(result.isValid).toBe(false);
  });

  it("should handle unclean paths (trailing/duplicate slashes)", () => {
    expect(validateMoveLocation("/a/../b", "/a/b/").isValid).toBe(true);

    expect(validateMoveLocation("/a/b", "/a//b").isValid).toBe(false);
  });
});
