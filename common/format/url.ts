/**
 * Safely setup a URL object from a string.
 *
 * @param url
 */
export function setupURL(url: string): URL {
  const hasProtocol = /^https?:\/\//i.test(url);
  return new URL(hasProtocol ? url : `https://${url}`);
}
