import { knex } from "../utils/database.ts";
import {
  FormSubmission,
  toFormAttachmentRow,
  toFormSubmissionRow,
} from "./convertRows.ts";

/**
 * Saves a public form submission to the database.
 *
 * @param siteId
 * @param submission
 * @returns
 */
export async function saveFormSubmission(
  siteId: string,
  submission: FormSubmission
): Promise<{ submissionId: string }> {
  // save the submission to the database
  let submissionId: string = "";

  await knex.transaction(async (trx) => {
    // create the submission row
    const submissionRow = toFormSubmissionRow(submission);
    if (submissionRow.id) {
      delete submissionRow.id;
    }

    // create the attachments rows
    const attachments = submission.attachments.map((attachment) =>
      toFormAttachmentRow(attachment)
    );

    // insert the submission row
    const [newId] = await trx("pub_form_submissions").insert(submissionRow);
    submissionId = newId.toString();

    if (!newId) {
      throw new Error(
        "Failed to collect the form submission. Please try again momentarily."
      );
    }

    for (const attachment of attachments) {
      attachment.submission_id = submissionId;
      await trx("pub_form_attachments").insert(attachment);
    }
  });

  return { submissionId };
}
