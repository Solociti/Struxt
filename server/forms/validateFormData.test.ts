import { FormSettingsModel } from "common/models/projects/forms/FormSettingsModel";
import { beforeEach, describe, expect, test } from "vitest";
import { validateFormData } from "./validateFormData";

describe("validate form data", () => {
  let formSettings = new FormSettingsModel({});

  beforeEach(() => {
    formSettings = new FormSettingsModel({
      projectId: "test-project",
      projectEnv: "production",
      formName: "test-form",
      enabled: true,
      fields: [
        {
          name: "form_name",
          type: "text",
          required: true,
        },
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "email",
          type: "email",
          required: true,
        },
        {
          name: "phone",
          type: "tel",
          required: false,
        },
        {
          name: "message",
          type: "text",
          required: false,
        },
      ],
    });
  });

  test("should validate correct data without errors", () => {
    const formData = {
      form_name: "test-form",
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      message: "Hello, this is a test message.",
    };
    const { formData: result, errors } = validateFormData(
      formSettings,
      formData
    );

    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      message: "Hello, this is a test message.",
    });
    expect(errors).toBeNull();
  });

  test("should validate correct data without errors skipping optional", () => {
    const formData = {
      form_name: "test-form",
      name: "John Doe",
      email: "john@example.com",
    };
    const { formData: result, errors } = validateFormData(
      formSettings,
      formData
    );

    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
    });
    expect(errors).toBeNull();
  });

  test("should validate data with extra information", () => {
    const formData = {
      form_name: "test-form",
      name: "John Doe",
      email: "john@example.com",
      skipThis: "extra data",
    };
    const { formData: result, errors } = validateFormData(
      formSettings,
      formData
    );

    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
    });
    expect(errors).toBeNull();
  });

  test("should return errors for missing required fields", () => {
    const formData = {
      form_name: "test-form",
      email: "test@example.com",
    };

    const { formData: result, errors } = validateFormData(
      formSettings,
      formData
    );
    expect(result).toEqual({
      email: "test@example.com",
    });
    expect(errors).toEqual([
      {
        name: "name",
        message: "Please enter a value.",
      },
    ]);
  });

  test("should return error for invalid data type", () => {
    const formData = {
      form_name: "test-form",
      name: "John Doe",
      email: "invalid-email",
    };
    const { formData: result, errors } = validateFormData(
      formSettings,
      formData
    );

    expect(result).toEqual({
      name: "John Doe",
    });
    expect(errors).toEqual([
      {
        name: "email",
        message: "Please enter a valid email address.",
      },
    ]);
  });
});
