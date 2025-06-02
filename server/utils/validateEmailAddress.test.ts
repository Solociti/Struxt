import { describe, expect, test } from "vitest";
import { validateEmailAddress } from "./validateEmailAddress";

describe("validateEmailAddress", () => {
  test("should validate a proper email address format", async () => {
    expect(await validateEmailAddress("user@example.com")).toBe(true);
    expect(await validateEmailAddress("user-name@example.com")).toBe(true);
    expect(await validateEmailAddress("user+123@example.com")).toBe(true);
  });

  test("should reject invalid email format", async () => {
    const email = "invalid-email";
    const result = await validateEmailAddress(email);

    expect(result).toBe(false);
  });

  test("should reject email with invalid format after @", async () => {
    const email = "invalid@domain";
    const result = await validateEmailAddress(email);

    expect(result).toBe(false);
  });

  test("should reject for email with no MX records", async () => {
    const email = "invalid@no-mx.solociti.com";
    const result = await validateEmailAddress(email);

    expect(result).toBe(false);
  });
});
