import { formatDate } from "common/format/date";
import { basename, join } from "node:path";
import { loadTemplate } from "../../email/loadTemplate";
import { sendEmail } from "../../email/sendEmail";
import { formatLabel } from "../../utils/formatText";
import { getProjectFormUploadDir } from "../../utils/uploadDir";
import { getFormSubmission } from "../getFormSubmission";
import { getFormSettings } from "../settings/getFormSettings";

export interface FormTemplateData {
  formName: string;

  dateReceived: string;

  formFields: {
    label: string;
    value: string;
  }[];
}

/**
 * Compile the email template for the forms
 *
 * @param context
 * @returns
 */
async function loadHtml(context: FormTemplateData) {
  const template = await loadTemplate("form");

  return template(context, {});
}

/**
 * Send the email with the form data
 *
 * @param submissionId
 */
export async function sendFormEmail(submissionId: string) {
  // load the information from database
  const submission = await getFormSubmission(submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }

  const settings = await getFormSettings(
    submission.projectId,
    submission.projectEnv,
    submission.formName
  );

  if (!settings || !settings.enabled || !settings.email.send) {
    return;
  }

  // setup the form fields
  const formFields: FormTemplateData["formFields"] = [];

  const keys = Object.keys(submission.formData);
  for (const key of keys) {
    const value = submission.formData[key];

    formFields.push({
      label: formatLabel(key),
      value: value.toString() || "N/A",
    });
  }

  // load the html
  let html = await loadHtml({
    formName: formatLabel(submission.formName),
    dateReceived: formatDate(submission.createdDate, true),
    formFields,
  });

  const uploadDir = getProjectFormUploadDir(submission.projectId);

  // send the email
  const subject = Handlebars.compile(
    settings.email.subject || "Form Submission"
  );
  const subjectText = subject({
    formName: formatLabel(submission.formName),
    ...submission.formData,
  });

  await sendEmail({
    to: settings.email.to,
    subject: subjectText,
    html,
    attachments: submission.attachments.map((attachment) => ({
      filename: basename(attachment.fileName),
      path: join(uploadDir, attachment.fileName),
    })),
  });
}
