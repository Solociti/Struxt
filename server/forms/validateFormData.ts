import { loadValidationData } from "./loadValidationData.ts";
import { sanitizeValue } from "./sanitize.ts";

export interface FormValidation {
  id?: string;

  projectId: string;
  siteEnv: "staging" | "production";
  formName: string;

  fieldName: string;
  type: "text" | "number" | "email" | "tel" | "boolean";
  required: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface FormValidationError {
  name: string;
  message: string;
}

/**
 * Validate the incoming form data and scrub it
 *
 * Return the scrubbed form data
 *
 * @param projectId
 * @param formData
 */
export async function validateFormData(
  projectId: string,
  siteEnv: "staging" | "production",
  formData: { [key: string]: string | number | boolean }
): Promise<{
  formName: string;
  formData: { [key: string]: string | number | boolean };
  errors: null | FormValidationError[];
}> {
  // get the form name
  const formName = formData.form_name as string;
  if (!formName || typeof formName !== "string") {
    throw new Error("form_name is required");
  }

  const scrubbedData: { [key: string]: string | number | boolean } = {};
  const errors: FormValidationError[] = [];

  const validation = await loadValidationData(projectId, siteEnv, formName);
  if (!validation.length) {
    throw new Error("No validation data found for form");
  }

  for (const fieldValidation of validation) {
    if (fieldValidation.fieldName === "form_name") {
      continue;
    }
    const key = fieldValidation.fieldName;
    if (typeof formData[key] === "undefined" && fieldValidation.required) {
      errors.push({
        name: key,
        message: "Please enter a value.",
      });
      continue;
    }

    // strip out any html tags
    const value = sanitizeValue(formData[key]);

    switch (fieldValidation.type) {
      case "text":
        if (typeof value === "string") {
          scrubbedData[key] = value;
        } else if (fieldValidation.required) {
          errors.push({
            name: key,
            message: "Please enter a value.",
          });
        }
        break;

      case "number":
        if (typeof value === "string") {
          scrubbedData[key] = Number(value);
        } else if (typeof value === "number") {
          scrubbedData[key] = value;
        } else if (fieldValidation.required) {
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
          scrubbedData[key] = value;
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
          scrubbedData[key] = value;
        } else {
          errors.push({
            name: key,
            message: "Please enter a valid phone number.",
          });
        }
        break;

      case "boolean":
        if (value === "true") {
          scrubbedData[key] = true;
        } else if (value === "false") {
          scrubbedData[key] = false;
        } else {
          scrubbedData[key] = Boolean(value);
        }
        break;

      default:
        // unknown type
        // TODO: Log this as an issue
        break;
    }
  }

  return {
    formName,
    formData: scrubbedData,
    errors: errors.length ? errors : null,
  };
}
