import z from "zod";

/**
 * Validation for simple IDs, such as project IDs and publish IDs.
 *
 * @returns
 */
export const zSimpleIdValidation = () =>
  z
    .string()
    .nonempty()
    .regex(
      /^[a-zA-Z0-9]{4,}-[a-zA-Z0-9]{8,}$/,
      "Project ID must be alphanumeric, or hyphens",
    );
