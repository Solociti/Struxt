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
 * @returns
 */
export function mergeDeep<T>(
  original: T,
  data: DeepPartial<T>,
  skipProps?: (keyof T)[]
): T {
  const skip = skipProps || ([] as (keyof T)[]);

  for (const key in data) {
    // skip the keys that are in the skip list
    if (skip.includes(key) || key.startsWith("_")) {
      continue;
    }

    if (data[key] && typeof data[key] === "object") {
      if (Array.isArray(data[key])) {
        (original[key] as any) = data[key];
      } else {
        (original[key] as any) = mergeDeep(original[key] || {}, data[key]);
      }
    } else {
      (original[key] as any) = data[key];
    }
  }

  return original;
}
