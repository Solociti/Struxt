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

export interface SanitizeObjOptions {
  /**
   * If set to true, the prop value will not be sanitized.
   */
  skipSanitize?: boolean;
}

/**
 * Recursively sanitize an object, including nested objects and arrays.
 *
 * @param obj
 * @param options
 * @param prefix only used for recursive.
 * @returns
 */
export function sanitizeObject<T extends object>(
  obj: T,
  options?: Record<string, SanitizeObjOptions>,
  prefix?: string
): T {
  const sanitizedObj: Partial<T> = {};

  for (const key in obj) {
    const sKey = sanitizeValue(key) as keyof T | null;
    if (sKey === null) {
      continue;
    }
    const value = obj[key];

    // setup prefix tracking to get options
    const currentKey = prefix ? `${prefix}.${String(sKey)}` : String(sKey);
    const sOptions: Required<SanitizeObjOptions> = {
      skipSanitize: false,
    };

    if (options) {
      for (const key in options) {
        if (currentKey === key) {
          Object.assign(sOptions, options[key]);
          break;
        }

        if (key.includes("*")) {
          // wildcard match
          const regex = new RegExp(
            `^${key.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`
          );

          if (regex.test(currentKey)) {
            Object.assign(sOptions, options[key]);
            break;
          }
        }
      }
    }

    if (sOptions.skipSanitize) {
      // skipping sanitization
      (sanitizedObj[sKey] as any) = value;
      continue;
    }

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
        (sanitizedObj[sKey] as any) = sanitizeArray(
          value as any[],
          options,
          currentKey
        );
        continue;
      }

      // Recursive...
      (sanitizedObj[sKey] as any) = sanitizeObject(
        value as object,
        options,
        currentKey
      );
      continue;
    }
  }

  return sanitizedObj as T;
}

/**
 * Recursively sanitize a list of values.
 *
 * @param list
 * @param options
 * @param prefix only used for recursive.
 */
function sanitizeArray<T>(
  list: T[],
  options?: Record<string, SanitizeObjOptions>,
  prefix?: string
): T[] {
  return list.map((item, index) => {
    const currentPrefix = prefix ? `${prefix}.${index}` : index.toString();

    if (typeof item === "object" && item !== null) {
      if (Array.isArray(item)) {
        return sanitizeArray(item, options, currentPrefix);
      }

      return sanitizeObject(item, options, currentPrefix);
    }
    return sanitizeValue(item as any);
  }) as T[];
}
