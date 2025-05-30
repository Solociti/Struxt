import { FormSettingsModel } from "common/models/projects/forms/FormSettingsModel";
import { sanitizeValue } from "../utils/sanitize";

export interface FormValidationError {
  name: string;
  message: string;
}

/**
 * Get the form name from the form data
 *
 * @param formData
 * @returns
 */
export function getFormName(formData: {
  [key: string]: string | number | boolean;
}): string {
  const formName = formData.form_name as string;
  if (!formName || typeof formName !== "string") {
    throw new Error("form_name is required");
  }
  return formName;
}

/**
 * Validate the incoming form data and scrub it
 *
 * Return the scrubbed form data
 *
 * @param projectId
 * @param formData
 */
export function validateFormData(
  formSettings: FormSettingsModel,
  formData: { [key: string]: string | number | boolean }
): {
  formData: { [key: string]: string | number | boolean };
  errors: null | FormValidationError[];
} {
  const data: { [key: string]: string | number | boolean } = {};
  const errors: FormValidationError[] = [];

  for (const field of formSettings.fields) {
    if (field.name === "form_name") {
      continue;
    }
    const key = field.name;
    if (typeof formData[key] === "undefined" && field.required) {
      errors.push({
        name: key,
        message: "Please enter a value.",
      });
      continue;
    }

    // strip out any html tags
    const value = sanitizeValue(formData[key]);

    switch (field.type) {
      case "text":
        if (typeof value === "string") {
          data[key] = value;
        } else if (field.required) {
          errors.push({
            name: key,
            message: "Please enter a value.",
          });
        }
        break;

      case "number":
        if (typeof value === "string") {
          data[key] = Number(value);
        } else if (typeof value === "number") {
          data[key] = value;
        } else if (field.required) {
          errors.push({
            name: key,
            message: "Please enter a number.",
          });
        }
        break;

      case "email":
        if (
          typeof value === "string" &&
          value.includes("@") &&
          value.includes(".")
        ) {
          data[key] = value;
        } else {
          errors.push({
            name: key,
            message: "Please enter a valid email address.",
          });
        }
        break;

      case "tel":
        // TODO: validate phone number
        if (typeof value === "string") {
          data[key] = value;
        } else if (field.required) {
          errors.push({
            name: key,
            message: "Please enter a valid phone number.",
          });
        }
        break;

      case "boolean":
        if (value === "true") {
          data[key] = true;
        } else if (value === "false") {
          data[key] = false;
        } else {
          data[key] = Boolean(value);
        }
        break;

      default:
        // unknown type
        // TODO: Log this as an issue
        break;
    }
  }

  return {
    formData: data,
    errors: errors.length ? errors : null,
  };
}
