import { describe, expect, test } from "vitest";
import { mergeDeep } from "./utils";

describe("mergeDeep", () => {
  test("merges top-level props", () => {
    const result = mergeDeep({ a: 1, b: 2 }, { b: 99 });

    expect(result).toEqual({ a: 1, b: 99 });
  });

  test("deep merges nested objects", () => {
    const result = mergeDeep({ a: { x: 1, y: 2 } }, { a: { y: 99 } });

    expect(result).toEqual({ a: { x: 1, y: 99 } });
  });

  test("skips top-level props in skipProps", () => {
    const result = mergeDeep({ a: 1, b: 2 }, { a: 99, b: 99 }, ["a"]);

    expect(result).toEqual({ a: 1, b: 99 });
  });

  test("skips nested props via dot notation", () => {
    const result = mergeDeep({ a: { x: 1, y: 2 } }, { a: { x: 99, y: 99 } }, [
      "a.x",
    ]);

    expect(result).toEqual({ a: { x: 1, y: 99 } });
  });

  test("skips deeply nested props via dot notation", () => {
    const result = mergeDeep(
      { a: { b: { c: 1, d: 2 } } },
      { a: { b: { c: 99, d: 99 } } },
      ["a.b.c"],
    );

    expect(result).toEqual({ a: { b: { c: 1, d: 99 } } });
  });

  test("skips props that start with _", () => {
    const result = mergeDeep(
      { _id: "original", name: "original" },
      { _id: "updated", name: "updated" },
    );

    expect(result).toEqual({ _id: "original", name: "updated" });
  });

  test("does not overwrite falsy original values with {}", () => {
    const result = mergeDeep({ a: null, b: false, c: 0 } as any, {
      a: { x: 1 },
      b: { x: 1 },
      c: { x: 1 },
    });

    expect(result).toEqual({ a: { x: 1 }, b: { x: 1 }, c: { x: 1 } });
  });

  test("replaces arrays instead of merging them", () => {
    const result = mergeDeep({ items: [1, 2, 3] }, { items: [4, 5] });

    expect(result).toEqual({ items: [4, 5] });
  });
});
