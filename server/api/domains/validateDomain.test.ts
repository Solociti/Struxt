import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { setBlacklistedDomains, validateDomain } from "./validateDomain";

// Mock the getRegisterDomain function
vi.mock("./proxyDomain", () => ({
  getRegisterDomain: vi.fn().mockReturnValue("example.com"),
}));

describe("validateDomain", () => {
  beforeEach(() => {
    // Reset and set up blacklist domains for testing
    setBlacklistedDomains([
      "blacklisted.com",
      "restricted.org",
      "keycloak.example.com",
      "proxy.example.com",
    ]);
  });

  afterEach(() => {
    // Clean up any test-specific configurations
    setBlacklistedDomains([]);
  });

  test("should validate a proper domain format", () => {
    const result = validateDomain("example.com", false);
    expect(result.isValid).toBe(true);
    expect(result.domain).toBe("example.com");
  });

  test("should normalize domain to lowercase", () => {
    const result = validateDomain("EXAMPLE.COM", false);
    expect(result.isValid).toBe(true);
    expect(result.domain).toBe("example.com");
  });

  test("should trim whitespace from domain", () => {
    const result = validateDomain(" example.com ", false);
    expect(result.isValid).toBe(true);
    expect(result.domain).toBe("example.com");
  });

  test("should reject domain that is too short", () => {
    const result = validateDomain("ab", false);
    expect(result.isValid).toBe(false);
    expect(result.domain).toBe("");
  });

  test("should reject empty domain", () => {
    const result = validateDomain("", false);
    expect(result.isValid).toBe(false);
    expect(result.domain).toBe("");
  });

  test("should reject invalid domain format", () => {
    const result = validateDomain("not-a-domain", false);
    expect(result.isValid).toBe(false);
    expect(result.domain).toBe("");
  });

  test("should create proper subdomain when isSubdomain is true", () => {
    const result = validateDomain("mysubdomain", true);
    expect(result.isValid).toBe(true);
    expect(result.domain).toBe("mysubdomain.example.com");
  });

  test("should reject subdomain when it contains dots", () => {
    const result = validateDomain("invalid.subdomain", true);
    expect(result.isValid).toBe(false);
    expect(result.domain).toBe("");
  });

  test("should reject domain that is in the blacklist", () => {
    const result = validateDomain("blacklisted.com", false);
    expect(result.isValid).toBe(false);
    expect(result.domain).toBe("");
  });

  test("should reject domain that ends with a blacklisted domain", () => {
    const result = validateDomain("sub.blacklisted.com", false);
    expect(result.isValid).toBe(false);
    expect(result.domain).toBe("");
  });

  test("should validate domain that has similar prefix to blacklisted domain", () => {
    const result = validateDomain("blacklistedprefix.com", false);
    expect(result.isValid).toBe(true);
    expect(result.domain).toBe("blacklistedprefix.com");
  });
});
