import { describe, expect, test } from "vitest";
import { CurrentUserModel } from "./CurrentUserModel";
import { hasPermission, PermType, roles } from "./Roles";

describe("User Roles", () => {
  test("should check if the user has the permission", () => {
    const user = new CurrentUserModel({
      id: "1",
      roles: ["struxt.editor"],
    });

    expect(user.hasPermission("struxt.editor")).to.equal(true);
  });

  test("hasPermission should return false for empty user roles", () => {
    const roles: string[] = [];
    const permissions: PermType = "struxt.editor";

    expect(hasPermission(roles, permissions)).to.equal(false);
  });

  test("should check a single permission", () => {
    const roles = ["struxt.editor"];
    const permissions: PermType = "struxt.editor";

    expect(hasPermission(roles, permissions)).to.equal(true);
  });

  test("should check a single false permission", () => {
    const roles = ["struxt.editor"];
    const permissions: PermType = "struxt.projects";

    expect(hasPermission(roles, permissions)).to.equal(false);
  });

  test("should perform a complex permission check", () => {
    const roles = ["struxt.editor", "struxt.publish.production"];
    const permissions: PermType = {
      and: [
        "struxt.editor",
        { or: ["struxt.publish.staging", "struxt.publish.production"] },
      ],
    };

    expect(hasPermission(roles, permissions)).to.equal(true);
  });

  test("perform a complex false permission check", () => {
    const roles = ["struxt.publish.staging"];

    const permissions: PermType = {
      or: [
        "struxt.editor",
        { and: ["struxt.publish.staging", "struxt.publish.production"] },
      ],
    };

    expect(hasPermission(roles, permissions)).to.equal(false);
  });
});
