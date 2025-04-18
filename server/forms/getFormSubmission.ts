import { FormSubmissionModel } from "common/models/projects/forms/FormSubmissionModel";
import { getCollection } from "server/database/mongodb";

/**
 * Load the submission data from server
 *
 * @param submissionId
 * @returns
 */
export async function getFormSubmission(submissionId: string) {
  const collection = await getCollection<FormSubmissionModel>(
    "form_submissions"
  );

  const doc = await collection.findOne({
    submissionId,
  });
  if (!doc) {
    return null;
  }

  return new FormSubmissionModel(doc);
}
