import { knex } from "../utils/database";
import { fromFormAttachmentRow, fromFormSubmissionRow } from "./convertRows";

/**
 * Load the submission data from server
 *
 * @param submissionId
 * @returns
 */
export async function getFormSubmission(submissionId: number) {
  const [row] = await knex("pub_form_submissions").where({
    id: submissionId,
  });

  if (!row) {
    throw new Error("Form submission not found");
  }
  const submission = fromFormSubmissionRow(row);

  // load the attachments
  const attachmentRows = await knex("pub_form_attachments").where({
    submission_id: submissionId,
  });
  submission.attachments = attachmentRows.map(fromFormAttachmentRow);

  return submission;
}
