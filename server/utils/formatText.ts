/**
 * Capitalize the first letter of each word in a string.
 *
 * @param text
 * @returns
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Converts col names or labels to title case
 *
 * @example formatLabel("first_name") => "First Name"
 * @example formatLabel("last-name") => "Last Name"
 *
 * @param label
 * @returns
 */
export function formatLabel(label: string): string {
  return capitalizeWords(label.replace(/_/g, " ").replace(/-/g, " "));
}
