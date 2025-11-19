import { describe, expect, test } from "vitest";
import { getCompactDate } from "./snapshotUtils";

describe("snapshotUtils", () => {
  test("should compact the dates correctly", () => {
    expect(getCompactDate(1763517618)).toBe(1763517600);
    expect(getCompactDate(1763517630)).toBe(1763517600);
    expect(getCompactDate(1763517660)).toBe(1763517600);
    expect(getCompactDate(1763517800)).toBe(1763517600);
  });
});
