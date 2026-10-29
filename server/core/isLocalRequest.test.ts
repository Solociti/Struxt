import { describe, expect, it } from "vitest";
import { isLocalRequest } from "./isLocalRequest";

describe("isLocalRequest", () => {
  it("allows loopback addresses", () => {
    expect(isLocalRequest("127.0.0.1", {})).toBe(true);
    expect(isLocalRequest("::1", {})).toBe(true);
    expect(isLocalRequest("::ffff:127.0.0.1", {})).toBe(true);
  });

  it("rejects other addresses", () => {
    expect(isLocalRequest("172.18.0.5", {})).toBe(false);
    expect(isLocalRequest(undefined, {})).toBe(false);
  });

  it("rejects proxied requests", () => {
    expect(isLocalRequest("127.0.0.1", { "x-forwarded-for": "1.2.3.4" })).toBe(
      false,
    );
    expect(isLocalRequest("127.0.0.1", { forwarded: "for=1.2.3.4" })).toBe(
      false,
    );
    expect(isLocalRequest("127.0.0.1", { "x-real-ip": "1.2.3.4" })).toBe(false);
  });
});
