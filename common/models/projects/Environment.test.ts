import { describe, expect, test } from "vitest";
import {
  ProjectEnvSettings,
  getValidDomains,
  setupProjectEnvSettings,
} from "./Environment";

describe("Environment", () => {
  describe("getValidDomains", () => {
    test("should return empty arrays and null when no domains exist", () => {
      const envSettings: ProjectEnvSettings = setupProjectEnvSettings({
        domains: [],
      });

      const result = getValidDomains(envSettings);

      expect(result.domains).toEqual([]);
      expect(result.redirectDomains).toEqual([]);
      expect(result.primaryDomain).toBeNull();
    });

    test("should filter out domains that are not enabled", () => {
      const envSettings: ProjectEnvSettings = setupProjectEnvSettings({
        domains: [
          {
            domain: "example.com",
            enabled: {
              active: false,
            },
            dnsVerified: { active: true },
            isPrimary: true,
            deleted: { active: false },
          },
          {
            domain: "valid.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: false,
            deleted: { active: false },
          },
        ],
      });

      const result = getValidDomains(envSettings);

      expect(result.domains).toHaveLength(1);
      expect(result.domains[0].domain).toBe("valid.com");
    });

    test("should filter out domains that are not DNS verified", () => {
      const envSettings: ProjectEnvSettings = setupProjectEnvSettings({
        domains: [
          {
            domain: "example.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: false },
            isPrimary: true,
            deleted: { active: false },
          },
          {
            domain: "valid.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: false,
            deleted: { active: false },
          },
        ],
      });

      const result = getValidDomains(envSettings);

      expect(result.domains).toHaveLength(1);
      expect(result.domains[0].domain).toBe("valid.com");
    });

    test("should filter out domains that are deleted", () => {
      const envSettings: ProjectEnvSettings = setupProjectEnvSettings({
        domains: [
          {
            domain: "example.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: true,
            deleted: {
              active: true,
            },
          },
          {
            domain: "valid.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: false,
            deleted: { active: false },
          },
        ],
      });

      const result = getValidDomains(envSettings);

      expect(result.domains).toHaveLength(1);
      expect(result.domains[0].domain).toBe("valid.com");
    });

    test("should identify primary domain correctly", () => {
      const envSettings: ProjectEnvSettings = setupProjectEnvSettings({
        domains: [
          {
            domain: "primary.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: true,
            deleted: { active: false },
          },
          {
            domain: "secondary.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: false,
            deleted: { active: false },
          },
        ],
      });

      const result = getValidDomains(envSettings);

      expect(result.domains).toHaveLength(2);
      expect(result.primaryDomain).not.toBeNull();
      expect(result.primaryDomain?.domain).toBe("primary.com");
      expect(result.redirectDomains).toHaveLength(1);
      expect(result.redirectDomains[0].domain).toBe("secondary.com");
    });

    test("should return correctly guess a primaryDomain when no primary domain is set", () => {
      const envSettings: ProjectEnvSettings = setupProjectEnvSettings({
        domains: [
          {
            domain: "domain1.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: false,
            deleted: { active: false },
          },
          {
            domain: "domain2.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: false,
            deleted: { active: false },
          },
        ],
      });

      const result = getValidDomains(envSettings);

      expect(result.domains).toHaveLength(2);
      expect(result.primaryDomain).not.toBeNull();
      expect(result.primaryDomain?.domain).toBe("domain1.com");
      expect(result.redirectDomains).toHaveLength(1);
    });

    test("should return the domain that starts with www as primary if no other primary is set", () => {
      const envSettings: ProjectEnvSettings = setupProjectEnvSettings({
        domains: [
          {
            domain: "example.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: false,
            deleted: { active: false },
          },
          {
            domain: "www.example.com",
            enabled: {
              active: true,
            },
            dnsVerified: { active: true },
            isPrimary: false,
            deleted: { active: false },
          },
        ],
      });
      const result = getValidDomains(envSettings);

      expect(result.domains).toHaveLength(2);
      expect(result.primaryDomain).not.toBeNull();
      expect(result.primaryDomain?.domain).toBe("www.example.com");
      expect(result.redirectDomains).toHaveLength(1);
      expect(result.redirectDomains[0].domain).toBe("example.com");
    });
  });
});
