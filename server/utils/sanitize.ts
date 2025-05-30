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

/**
 * Recursively sanitize an object, including nested objects and arrays.
 *
 * @param obj
 * @returns
 */
export function sanitizeObject<T extends object>(obj: T): T {
  const sanitizedObj: Partial<T> = {};

  for (const key in obj) {
    const sKey = sanitizeValue(key) as keyof T | null;
    if (sKey === null) {
      continue;
    }
    const value = obj[key];

    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      typeof value === "number"
    ) {
      (sanitizedObj[sKey] as any) = sanitizeValue(value);
      continue;
    }

    if (value === null) {
      // NULL
      (sanitizedObj[sKey] as any) = null;
      continue;
    }

    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        // Arrays...
        (sanitizedObj[sKey] as any) = sanitizeArray(value as any[]);
        continue;
      }

      // Recursive...
      (sanitizedObj[sKey] as any) = sanitizeObject(value as object);
      continue;
    }
  }

  return sanitizedObj as T;
}

/**
 * Recursively sanitize a list of values.
 */
function sanitizeArray<T>(list: T[]): T[] {
  return list.map((item) => {
    if (typeof item === "object" && item !== null) {
      if (Array.isArray(item)) {
        return sanitizeArray(item);
      }

      return sanitizeObject(item);
    }
    return sanitizeValue(item as any);
  }) as T[];
}
