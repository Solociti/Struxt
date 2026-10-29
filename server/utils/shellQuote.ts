/**
 * Quote a value so it is passed to a POSIX shell as a single literal argument.
 *
 * @param value
 * @returns
 */
export function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
