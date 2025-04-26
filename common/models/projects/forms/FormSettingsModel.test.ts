import { DeepPartial } from "common/models/utils";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  FormSettingsField,
  FormSettingsModel,
} from "../../../models/projects/forms/FormSettingsModel";
import { EnvironmentTypes } from "../../projects/Environment";

describe("FormSettingsModel", () => {
  let currentTime: number;

  beforeEach(() => {
    currentTime = Math.floor(Date.now() / 1000);
    vi.spyOn(Date, "now").mockReturnValue(currentTime * 1000);
  });

  test("should initialize with default values", () => {
    const model = new FormSettingsModel();

    expect(model).toEqual({
      projectId: "",
      projectEnv: "staging",
      formName: "",
      enabled: false,
      email: {
        send: false,
        to: "",
        subject: "",
      },
      fields: [],
      created: {
        date: currentTime,
        userId: "",
        displayName: "",
      },
      updated: {
        date: 0,
        userId: "",
        displayName: "",
      },
    });
  });

  test("should initialize with provided data", () => {
    const data: DeepPartial<FormSettingsModel> = {
      projectId: "test-project",
      projectEnv: "production" as EnvironmentTypes,
      formName: "test-form",
      enabled: true,
      email: {
        send: true,
        to: "test@example.com",
        subject: "Test Subject",
      },
      fields: [
        { name: "name", required: true },
        { name: "email", type: "email", required: true },
      ],
    };

    const model = new FormSettingsModel(data);

    expect(model).toEqual({
      projectId: "test-project",
      projectEnv: "production",
      formName: "test-form",
      enabled: true,
      email: {
        send: true,
        to: "test@example.com",
        subject: "Test Subject",
      },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email", required: true },
      ],
      created: {
        date: currentTime,
        userId: "",
        displayName: "",
      },
      updated: {
        date: 0,
        userId: "",
        displayName: "",
      },
    });
  });

  test("should update fields directly with updateFields method", () => {
    const model = new FormSettingsModel();
    const fields: FormSettingsField[] = [
      { name: "age", type: "number", required: false },
      { name: "test" } as FormSettingsField,
    ];

    model.updateFields(fields);

    expect(model.fields).toHaveLength(2);

    expect(model.fields[0]).toEqual({
      name: "age",
      type: "number",
      required: false,
    });

    expect(model.fields[1]).toEqual({
      name: "test",
      type: "text",
      required: false,
    });
  });

  test("should clone the model correctly", () => {
    const model = new FormSettingsModel({
      projectId: "test-project",
      fields: [{ name: "name", type: "text", required: true }],
    });

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(FormSettingsModel);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
