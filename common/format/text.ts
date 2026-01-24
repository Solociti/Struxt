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
