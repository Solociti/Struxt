import sanitizeHtml from "sanitize-html";

/**
 * Sanitize the value of a form field.
 *
 * @param value
 * @returns
 */
export function sanitizeValue(value: string | boolean | number) {
  if (typeof value === "string") {
    const text = sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: "discard",
    });

    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  return null;
}
