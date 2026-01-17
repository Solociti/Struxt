import { describe, expect, test } from "vitest";
import { AssetModel } from "./AssetModel";

describe("AssetModel", () => {
  test("should initialize with default values", () => {
    const date = Math.floor(Date.now() / 1000);
    const model = new AssetModel();

    expect(model.created.date).toBeGreaterThanOrEqual(date);

    expect(model).toEqual({
      uuid: "",
      projectId: "",
      displayName: "",
      path: "",
      isExternalSrc: false,
      size: 0,
      dimensions: {
        width: 0,
        height: 0,
      },
      created: {
        date: expect.any(Number),
        displayName: "",
        userId: "",
      },
      updated: {
        date: 0,
        displayName: "",
        userId: "",
      },
      deleted: {
        active: false,
        date: 0,
        displayName: "",
        userId: "",
        originalPath: "",
      },
    });
  });

  test("should initialize with provided data", () => {
    const model = new AssetModel({
      uuid: "asset-123",
      projectId: "proj-456",
      displayName: "Logo",
      path: "/assets/logo.png",
      size: 1024,
      dimensions: {
        width: 100,
        height: 50,
      },
      created: {
        date: 123456,
        userId: "u-1",
        displayName: "User 1",
      },
    });

    expect(model).toEqual({
      uuid: "asset-123",
      projectId: "proj-456",
      displayName: "Logo",
      path: "/assets/logo.png",
      isExternalSrc: false,
      size: 1024,
      dimensions: {
        width: 100,
        height: 50,
      },
      created: {
        date: 123456,
        userId: "u-1",
        displayName: "User 1",
      },
      updated: {
        date: 0,
        displayName: "",
        userId: "",
      },
      deleted: {
        active: false,
        date: 0,
        displayName: "",
        userId: "",
        originalPath: "",
      },
    });
  });

  test("should clone the model correctly", () => {
    const model = new AssetModel({
      uuid: "asset-123",
      projectId: "proj-456",
      displayName: "Logo",
      path: "/assets/logo.png",
    });

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(AssetModel);
    expect(cloned).not.toBe(model);
    expect(cloned).toEqual(model);
  });
});

describe("AssetModel.getFileName", () => {
  describe("Local Paths", () => {
    test("should extract filename from standard path", () => {
      const result = AssetModel.getFileName("/assets/images/logo.png");
      expect(result).toBe("logo.png");
    });

    test("should extract filename from root-level file", () => {
      const result = AssetModel.getFileName("/logo.png");
      expect(result).toBe("logo.png");
    });

    test("should extract filename from deep nested path", () => {
      const result = AssetModel.getFileName(
        "/assets/images/subfolder/deep/file.jpg"
      );
      expect(result).toBe("file.jpg");
    });

    test("should handle filename with no extension", () => {
      const result = AssetModel.getFileName("/assets/document");
      expect(result).toBe("document");
    });

    test("should handle filename with multiple dots", () => {
      const result = AssetModel.getFileName("/assets/my.file.name.tar.gz");
      expect(result).toBe("my.file.name.tar.gz");
    });

    test("should extract directory name from trailing slash", () => {
      const result = AssetModel.getFileName("/assets/images/");
      expect(result).toBe("images");
    });

    test("should handle path without leading slash", () => {
      const result = AssetModel.getFileName("assets/logo.png");
      expect(result).toBe("logo.png");
    });

    test("should handle multiple consecutive slashes", () => {
      const result = AssetModel.getFileName("/assets//images///logo.png");
      expect(result).toBe("logo.png");
    });
  });

  describe("External URLs", () => {
    test("should extract filename from basic HTTP URL", () => {
      const result = AssetModel.getFileName("http://example.com/image.png");
      expect(result).toBe("image.png");
    });

    test("should extract filename from basic HTTPS URL", () => {
      const result = AssetModel.getFileName("https://example.com/image.png");
      expect(result).toBe("image.png");
    });

    test("should extract filename from URL with query params", () => {
      const result = AssetModel.getFileName(
        "https://example.com/image.png?v=123&size=large"
      );
      expect(result).toBe("image.png");
    });

    test("should extract filename from URL with fragment", () => {
      const result = AssetModel.getFileName(
        "https://example.com/image.png#section"
      );
      expect(result).toBe("image.png");
    });

    test("should extract filename from URL with both params and fragment", () => {
      const result = AssetModel.getFileName(
        "https://example.com/file.pdf?download=1#page=5"
      );
      expect(result).toBe("file.pdf");
    });

    test("should extract filename from nested path in URL", () => {
      const result = AssetModel.getFileName(
        "https://cdn.example.com/assets/images/logo.png"
      );
      expect(result).toBe("logo.png");
    });

    test("should decode URL-encoded characters", () => {
      const result = AssetModel.getFileName(
        "https://example.com/My%20File%20Name.png"
      );
      expect(result).toBe("My File Name.png");
    });

    test("should extract path from URL with trailing slash", () => {
      const result = AssetModel.getFileName("https://example.com/path/");
      expect(result).toBe("path");
    });

    test("should handle multiple consecutive slashes in URL", () => {
      const result = AssetModel.getFileName(
        "https://example.com/assets//images///logo.png///"
      );
      expect(result).toBe("logo.png");
    });
  });

  describe("Edge Cases", () => {
    test("should return empty string for empty input", () => {
      const result = AssetModel.getFileName("");
      expect(result).toBe("");
    });

    test("should return empty string for just slash", () => {
      const result = AssetModel.getFileName("/");
      expect(result).toBe("");
    });

    test("should extract filename from protocol-relative URL", () => {
      const result = AssetModel.getFileName("//example.com/image.png");
      expect(result).toBe("image.png");
    });
  });
});
