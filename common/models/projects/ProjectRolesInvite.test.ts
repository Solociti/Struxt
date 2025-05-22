import { describe, expect, test } from "vitest";
import { ProjectRolesInviteModel } from "./ProjectRolesInviteModel";

describe("ProjectRolesInviteModel", () => {
  test("should initialize with default values", () => {
    const model = new ProjectRolesInviteModel();

    const date = Math.floor(Date.now() / 1000);
    expect(model.created.date).within(date - 1, date);
    model.created.date = 0;

    const expireDate = date + 172800;
    expect(model.expirationDate).within(expireDate - 1, expireDate);
    model.expirationDate = 0;

    expect(model).toEqual({
      inviteId: "",
      projectId: "",
      email: "",
      message: "",
      roles: [],
      created: { date: 0, userId: "", displayName: "" },
      accepted: { active: false, date: 0, userId: "", displayName: "" },
      emailSent: { active: false, date: 0 },
      expirationDate: 0,
    });
  });

  test("should initialize with provided data", () => {
    const model = new ProjectRolesInviteModel({
      inviteId: "invite-1",
      projectId: "p-1",
      created: {
        date: 12345,
        userId: "user-1",
        displayName: "User 1",
      },
      expirationDate: 123456,
    });

    expect(model).toEqual({
      inviteId: "invite-1",
      projectId: "p-1",
      email: "",
      message: "",
      roles: [],
      created: {
        date: 12345,
        userId: "user-1",
        displayName: "User 1",
      },
      accepted: { active: false, date: 0, userId: "", displayName: "" },
      emailSent: { active: false, date: 0 },
      expirationDate: 123456,
    });
  });

  test("should clone the model correctly", () => {
    const model = new ProjectRolesInviteModel();

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(ProjectRolesInviteModel);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
