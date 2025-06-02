import { hasValidMxRecord } from "./dns/checkMx";

/**
 * Validate an email address by checking with regex and DNS records.
 *
 * @param email
 * @returns
 */
export async function validateEmailAddress(email: string): Promise<boolean> {
  const regex = /^[\w-+\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!regex.test(email)) {
    return false;
  }

  // split the email into components
  const [_, domain] = email.split("@");

  // check if the domain has valid MX records
  const validMx = await hasValidMxRecord(domain);
  return validMx;
}
