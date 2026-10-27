/**
 * Truncate a text to the given length and center it.
 *
 * @param text
 * @param maxLength
 * @returns
 */
export function centerTruncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }
  const halfLength = Math.floor((maxLength - 3) / 2);

  return `${text.substring(0, halfLength)}...${text.substring(text.length - halfLength)}`;
}

/**
 * Capitalize the first letter of each word in the given text.
 *
 * @param text
 * @returns
 */
export function textCapitalize(text: string) {
  if (!text) {
    return text;
  }
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
