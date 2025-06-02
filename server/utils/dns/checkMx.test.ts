import { describe, expect, test } from "vitest";
import { hasValidMxRecord } from "./checkMx";

describe("hasValidMxRecord", () => {
  test("should return true when domain has MX records", async () => {
    // Using a domain that's known to have MX records
    const domain = "solociti.com";

    const result = await hasValidMxRecord(domain);

    expect(result).toBe(true);
  });

  test("should return false when domain has no MX records", async () => {
    // Using a subdomain that likely doesn't have MX records
    const domain = "no-mx-records-subdomain.solociti.com";

    const result = await hasValidMxRecord(domain);

    expect(result).toBe(false);
  });

  test("should return false when domain doesn't exist", async () => {
    // Using a non-existent domain
    const domain = "domain-that-probably-does-not-exist.xyz";

    const result = await hasValidMxRecord(domain);

    expect(result).toBe(false);
  });
});
