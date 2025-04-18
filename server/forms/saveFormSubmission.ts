import { FormSubmissionModel } from "common/models/projects/forms/FormSubmissionModel";
import { getCollection } from "server/database/mongodb";

/**
 * Saves a public form submission to the database.
 *
 * @param siteId
 * @param submission
 * @returns
 */
export async function saveFormSubmission(submission: FormSubmissionModel) {
  const collection = await getCollection<FormSubmissionModel>(
    "form_submissions"
  );

  await collection.insertOne(submission);
}
