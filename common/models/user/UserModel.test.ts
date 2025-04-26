import { describe, expect, test } from "vitest";
import { UserModel } from "./UserModel";

describe("UserModel", () => {
  test("should initialize with default values", () => {
    const model = new UserModel();

    expect(model.created.date).to.be.closeTo(Math.floor(Date.now() / 1000), 5);
    model.created.date = 0;

    expect(model).toEqual({
      id: "",
      email: "",
      name: "",
      roles: [],
      created: { date: 0, userId: "", displayName: "" },
      updated: { date: 0, userId: "", displayName: "" },
    });
  });

  test("should initialize with provided data", () => {
    const model = new UserModel({
      created: {
        date: 1234,
      },
      roles: ["admin"],
    });

    expect(model).toEqual({
      id: "",
      email: "",
      name: "",
      roles: ["admin"],
      created: { date: 1234, userId: "", displayName: "" },
      updated: { date: 0, userId: "", displayName: "" },
    });
  });

  test("should clone the model correctly", () => {
    const model = new UserModel();

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(UserModel);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
