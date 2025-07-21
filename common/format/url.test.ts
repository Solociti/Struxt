import { describe, expect, test } from "vitest";
import { setupURL } from "./url";

describe("setupURL", () => {
  test("should return a URL object when given a full URL with protocol", () => {
    const input = "https://example.com/path?query=1";
    const result = setupURL(input);
    expect(result).toBeInstanceOf(URL);
    expect(result.href).toBe("https://example.com/path?query=1");
  });

  test("should add https protocol if missing", () => {
    const input = "example.com/path";
    const result = setupURL(input);
    expect(result).toBeInstanceOf(URL);
    expect(result.href).toBe("https://example.com/path");
  });

  test("should handle http protocol", () => {
    const input = "http://example.com";
    const result = setupURL(input);
    expect(result).toBeInstanceOf(URL);
    expect(result.href).toBe("http://example.com/");
  });

  test("should handle URLs with query and hash", () => {
    const input = "example.com/path?foo=bar#section";
    const result = setupURL(input);
    expect(result.href).toBe("https://example.com/path?foo=bar#section");
  });

  test("should handle URLs with uppercase protocol", () => {
    const input = "HTTP://example.com";
    const result = setupURL(input);
    expect(result.href).toBe("http://example.com/");
  });

  test("should throw for invalid URLs", () => {
    expect(() => setupURL("not a url")).toThrow();
  });
});
