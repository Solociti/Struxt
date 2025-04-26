import { describe, expect, test } from "vitest";
import { FormSubmissionModel } from "./FormSubmissionModel";

describe("FormSubmissionModel", () => {
  test("should initialize with default values", () => {
    const model = new FormSubmissionModel();

    expect(model.createdDate).to.be.closeTo(Math.floor(Date.now() / 1000), 5);
    model.createdDate = 0; // Set to a fixed value for comparison

    expect(model).toEqual({
      submissionId: "",
      projectId: "",
      projectEnv: "staging",
      formName: "",
      formData: {},
      attachments: [],
      ipAddress: "",
      userAgent: "",
      sentEmailId: "",
      createdDate: 0,
    });
  });

  test("should update with partial data", () => {
    const model = new FormSubmissionModel({
      formName: "Updated Form",
      formData: { message: "Hello" },
      attachments: [
        {
          fileName: "updated.pdf",
          originalName: "original_updated.pdf",
        },
      ],
      createdDate: 1234,
    });

    expect(model).toEqual({
      submissionId: "",
      projectId: "",
      projectEnv: "staging",
      formName: "Updated Form",
      formData: { message: "Hello" },
      attachments: [
        { fileName: "updated.pdf", originalName: "original_updated.pdf" },
      ],
      ipAddress: "",
      userAgent: "",
      sentEmailId: "",
      createdDate: 1234,
    });
  });

  test("should clone the model correctly", () => {
    const initialData = {
      submissionId: "clone123",
      projectId: "clone456",
      formData: { key: "value" },
      attachments: [{ fileName: "clone.txt", originalName: "orig_clone.txt" }],
    };
    const model = new FormSubmissionModel(initialData);

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(FormSubmissionModel);
    expect(cloned).not.toBe(model); // Should be a different instance

    // Ensure deep equality
    expect(cloned).toEqual(model);
  });
});
