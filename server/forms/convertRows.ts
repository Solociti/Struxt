export interface FormAttachment {
  id?: number;

  submissionId: number;

  fileName: string;
  originalName: string;

  avStatus: "pending" | "approved" | "rejected";
  avResult: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert from the database row
 *
 * @param row
 * @returns
 */
export function fromFormAttachmentRow(row: any): FormAttachment {
  return {
    id: row.id,
    submissionId: row.submission_id,
    fileName: row.file_name,
    originalName: row.original_name,
    avStatus: row.av_status,
    avResult: row.av_result,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert to the database row
 *
 * @param attachment
 * @returns
 */
export function toFormAttachmentRow(attachment: FormAttachment): any {
  return {
    id: attachment.id,
    submission_id: attachment.submissionId,
    file_name: attachment.fileName,
    original_name: attachment.originalName,
    av_status: attachment.avStatus,
    av_result: attachment.avResult,
    updated_at: attachment.updatedAt,
  };
}

export interface FormSubmission {
  id?: number;

  siteId: string;
  formName: string;

  ipAddress: string;
  userAgent: string;

  sentEmailId: string;

  createdAt: Date;
  updatedAt: Date;

  contents: { [key: string]: string | number | boolean };

  attachments: FormAttachment[];
}

/**
 * Convert from the database row
 *
 * @param row
 * @returns
 */
export function fromFormSubmissionRow(row: any): FormSubmission {
  return {
    id: row.id,
    siteId: row.site_id,
    formName: row.form_name,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    sentEmailId: row.sent_email_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contents: JSON.parse(row.contents),
    attachments: [],
  };
}

/**
 * Convert to the database row
 *
 * @param submission
 * @returns
 */
export function toFormSubmissionRow(submission: FormSubmission): any {
  return {
    id: submission.id,
    site_id: submission.siteId,

    form_name: submission.formName,

    ip_address: submission.ipAddress,
    user_agent: submission.userAgent,

    sent_email_id: submission.sentEmailId,

    updated_at: submission.updatedAt,

    contents: JSON.stringify(submission.contents),
  };
}

export interface FormSettings {
  id?: number;

  siteId: number;
  siteEnv: "staging" | "production";
  formName: string;

  enabled: boolean;

  sendEmail: boolean;
  emailTo: string;
  emailSubject: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert from the database row
 *
 * @param row
 * @returns
 */
export function fromFormSettingsRow(row: any): FormSettings {
  return {
    id: row.id,
    siteId: row.site_id,
    siteEnv: row.site_env,
    formName: row.form_name,
    enabled: row.enabled,
    sendEmail: row.send_email,
    emailTo: row.email_to,
    emailSubject: row.email_subject,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert to the database row
 *
 * @param settings
 * @returns
 */
export function toFormSettingsRow(settings: FormSettings): any {
  return {
    id: settings.id,
    site_id: settings.siteId,
    form_name: settings.formName,
    enabled: settings.enabled,
    send_email: settings.sendEmail,
    email_to: settings.emailTo,
    email_subject: settings.emailSubject,
    updated_at: settings.updatedAt,
  };
}
