export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Merge the data into the original object
 *
 * Arrays need to be handled separately
 *
 * Props that start with `_` are skipped
 *
 * @param original
 * @param data
 * @param skipProps Dot-notation paths to skip e.g. `["a", "b.c.d"]`
 */
export function mergeDeep<T>(
  original: T,
  data: DeepPartial<T>,
  skipProps?: string[],
): T {
  const skip = skipProps || [];

  for (const key in data) {
    if (skip.includes(key) || key.startsWith("_")) {
      continue;
    }

    if (data[key] && typeof data[key] === "object") {
      if (Array.isArray(data[key])) {
        (original[key] as any) = data[key];
      } else {
        const nestedSkip = skip
          .filter((p) => p.startsWith(`${key}.`))
          .map((p) => p.slice(key.length + 1));

        const base =
          typeof original[key] === "object" && original[key] !== null
            ? original[key]
            : {};

        (original[key] as any) = mergeDeep(base, data[key], nestedSkip);
      }
    } else {
      (original[key] as any) = data[key];
    }
  }

  return original;
}
