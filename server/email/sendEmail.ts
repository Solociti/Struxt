import * as nodemailer from "nodemailer";
import { MailOptions } from "nodemailer/lib/sendmail-transport";

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail = process.env.SMTP_FROM;

/**
 * Send a new email
 *
 * @param options
 * @returns
 */
export async function sendEmail(options: MailOptions) {
  const result = await transporter.sendMail({
    from: fromEmail,
    ...options,
  });

  return result;
}
