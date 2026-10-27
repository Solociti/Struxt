/**
 * Checks whether an error maps to a Kubernetes API status code.
 *
 * @param err
 * @param statusCode
 */
export function isStatusCode(err: unknown, statusCode: number): boolean {
  if (!err || typeof err !== "object") {
    return false;
  }

  const errorWithCode = err as { code?: number; statusCode?: number };
  return (
    errorWithCode.code === statusCode || errorWithCode.statusCode === statusCode
  );
}
