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
 * @example colToTitle("first_name") => "First Name"
 * @example colToTitle("last-name") => "Last Name"
 *
 * @param label
 * @returns
 */
export function formatLabel(label: string): string {
  return capitalizeWords(label.replace(/_/g, " ").replace(/-/g, " "));
}
