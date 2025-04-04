/**
 * Round a number to a specified number of decimal places.
 *
 * @param num
 * @param decimalPlaces
 * @returns
 */
export function roundNumber(num: number, decimalPlaces: number): number {
  if (isNaN(num)) {
    return NaN;
  }

  const factor = Math.pow(10, decimalPlaces);
  return Math.round(num * factor) / factor;
}
