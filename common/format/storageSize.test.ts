import { describe, expect, test } from "vitest";
import { formatStorageSize } from "./storageSize";

describe("formatStorageSize", () => {
  test("should format 0 bytes correctly", () => {
    expect(formatStorageSize(0)).toBe("0 B");
  });

  test("should format bytes correctly", () => {
    expect(formatStorageSize(500)).toBe("500 B");
    expect(formatStorageSize(511)).toBe("511 B");
    // Should flip to KB at 512B
    expect(formatStorageSize(512)).toBe("0.5 KB");
  });

  test("should format kilobytes correctly", () => {
    expect(formatStorageSize(1024)).toBe("1 KB");
    expect(formatStorageSize(1536)).toBe("1.5 KB");
    expect(formatStorageSize(2048)).toBe("2 KB");
    // Should flip to MB at 512KB
    expect(formatStorageSize(512 * 1024)).toBe("0.5 MB");
  });

  test("should format megabytes correctly", () => {
    expect(formatStorageSize(1024 * 1024)).toBe("1 MB");
    expect(formatStorageSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    // Should flip to GB at 512MB
    expect(formatStorageSize(512 * 1024 * 1024)).toBe("0.5 GB");
  });

  test("should format gigabytes correctly", () => {
    expect(formatStorageSize(1024 * 1024 * 1024)).toBe("1 GB");
    expect(formatStorageSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
    // Should flip to TB at 512GB
    expect(formatStorageSize(512 * 1024 * 1024 * 1024)).toBe("0.5 TB");
  });

  test("should format terabytes correctly", () => {
    expect(formatStorageSize(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
  });

  test("should handle very large sizes", () => {
    // 1024^10 bytes. The formatter stops at TB (index 4).
    // So it divides by 1024 four times.
    // Resulting value in TB: 1024^(10-4) = 1024^6.
    const hugeBytes = Math.pow(1024, 10);
    const expectedValue = Math.pow(1024, 6);
    expect(formatStorageSize(hugeBytes)).toBe(`${expectedValue} TB`);
  });
});
