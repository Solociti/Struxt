import { describe, expect, test } from "vitest";
import { isPathInside } from "./path";
import { sep } from "node:path";

describe("isPathInside", () => {
  test("should return true when child is deeply nested inside parent", () => {
    // e.g. /a/b/c inside /a
    const parent = `${sep}var${sep}www`;
    const child = `${sep}var${sep}www${sep}html${sep}index.html`;
    expect(isPathInside(child, parent)).toBe(true);
  });

  test("should return true when child is directly inside parent", () => {
    // e.g. /a/b inside /a
    const parent = `${sep}var${sep}www`;
    const child = `${sep}var${sep}www${sep}index.html`;
    expect(isPathInside(child, parent)).toBe(true);
  });

  test("should return true when child is same as parent", () => {
    // e.g. /a inside /a
    const parent = `${sep}var${sep}www`;
    const child = `${sep}var${sep}www`;
    expect(isPathInside(child, parent)).toBe(true);
  });

  test("should return true even with trailing slashes", () => {
    const parent = `${sep}var${sep}www${sep}`;
    const child = `${sep}var${sep}www${sep}index.html`;
    expect(isPathInside(child, parent)).toBe(true);
  });

  test("should return false when child is the parent's parent", () => {
    const parent = `${sep}var${sep}www`;
    const child = `${sep}var`;
    expect(isPathInside(child, parent)).toBe(false);
  });

  test("should return false when child is outside parent tree (sibling)", () => {
    const parent = `${sep}var${sep}www`;
    const child = `${sep}var${sep}log`;
    expect(isPathInside(child, parent)).toBe(false);
  });

  test("should return false when child shares a prefix but is not inside", () => {
    // e.g. /var/www-fake vs /var/www
    const parent = `${sep}var${sep}www`;
    const child = `${sep}var${sep}www-fake`;
    expect(isPathInside(child, parent)).toBe(false);
  });

  test("should throw if child is not absolute", () => {
    expect(() => isPathInside("relative/path", `${sep}tmp`)).toThrow("paths must be absolute");
  });

  test("should throw if parent is not absolute", () => {
    expect(() => isPathInside(`${sep}tmp`, "relative/path")).toThrow("paths must be absolute");
  });
});
