import { basename, join } from "node:path";
import { sendEmail } from "../../email/sendEmail";
import { loadTemplate } from "../../email/templates/loadTemplate";
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
export async function sendFormEmail(submissionId: number) {
  // load the information from database
  const formData = await getFormSubmission(submissionId);
  const settings = await getFormSettings(
    formData.siteId,
    formData.siteEnv,
    formData.formName
  );

  if (!settings || !settings.enabled || !settings.sendEmail) {
    return;
  }

  // setup the form fields
  const formFields: FormTemplateData["formFields"] = [];

  const keys = Object.keys(formData.contents);
  for (const key of keys) {
    const value = formData.contents[key];

    formFields.push({
      label: formatLabel(key),
      value: value.toString() || "N/A",
    });
  }

  // load the html
  let html = await loadHtml({
    formName: formatLabel(formData.formName),
    dateReceived: formData.createdAt.toDateString(),
    formFields,
  });

  const uploadDir = getProjectFormUploadDir(formData.siteId.toString());

  // return { html, formData, settings, uploadDir, formFields };
  // send the email
  await sendEmail({
    to: settings.emailTo,
    subject: settings.emailSubject,
    html,
    attachments: formData.attachments.map((attachment) => ({
      filename: basename(attachment.fileName),
      path: join(uploadDir, attachment.fileName),
    })),
  });
}
