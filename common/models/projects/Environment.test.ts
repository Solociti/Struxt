import { describe, expect, test } from "vitest";
import {
  ProjectEnvSettings,
  getValidDomains,
  setupDomainData,
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

  describe("setupDomainData", () => {
    test("should create domain data with default values when given empty object", () => {
      const now = Math.floor(Date.now() / 1000);
      const domain = setupDomainData({});

      expect(domain.created.date).to.be.within(now - 2, now + 1);
      domain.created.date = 0;

      expect(domain).toEqual({
        domain: "",
        dnsVerified: { active: false, date: 0 },
        enabled: { active: false, date: 0, userId: "", displayName: "" },
        isPrimary: false,
        deleted: { active: false, date: 0, userId: "", displayName: "" },
        created: {
          date: expect.any(Number),
          userId: "",
          displayName: "",
        },
      });
    });

    test("should merge provided values with defaults", () => {
      const partialData = {
        domain: "example.com",
        isPrimary: true,
        enabled: {
          active: true,
          userId: "user123",
          displayName: "Test User",
        },
        created: {
          date: 0,
        },
      };

      const domain = setupDomainData(partialData);

      expect(domain).toEqual({
        domain: "example.com",
        isPrimary: true,
        enabled: {
          active: true,
          date: 0,
          userId: "user123",
          displayName: "Test User",
        },
        dnsVerified: { active: false, date: 0 },
        deleted: { active: false, date: 0, userId: "", displayName: "" },
        created: {
          date: 0,
          userId: "",
          displayName: "",
        },
      });
    });

    test("should properly handle nested objects", () => {
      const partialData = {
        domain: "test.com",
        created: {
          date: 0,
        },
        dnsVerified: {
          active: true,
          date: 12345,
        },
        deleted: {
          active: true,
          userId: "admin",
          displayName: "Admin User",
        },
      };

      const domain = setupDomainData(partialData);

      const expected = {
        domain: "test.com",
        isPrimary: false,
        enabled: { active: false, date: 0, userId: "", displayName: "" },
        dnsVerified: { active: true, date: 12345 },
        deleted: {
          active: true,
          date: 0,
          userId: "admin",
          displayName: "Admin User",
        },
        created: {
          date: expect.any(Number),
          userId: "",
          displayName: "",
        },
      };

      expect(domain).toEqual(expected);
    });
  });
});
