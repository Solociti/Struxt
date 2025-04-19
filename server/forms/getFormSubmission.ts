import { EnvironmentTypes } from "common/models/projects/Environment";
import { FormDetails } from "common/models/projects/Forms";
import { FormSubmissionModel } from "common/models/projects/forms/FormSubmissionModel";
import { getCollection, toArray } from "server/database/mongodb";
import { getFormSettings } from "./settings/getFormSettings";

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

/**
 * Creates a list of forms with the submission count for the project
 *
 * @param projectId
 * @param projectEnv
 * @returns
 */
export async function getFormSubmissionList(
  projectId: string,
  projectEnv: EnvironmentTypes
) {
  const collection = await getCollection<FormSubmissionModel>(
    "form_submissions"
  );

  const cursor = collection.aggregate<{ formName: string; count: number }>([
    {
      $match: {
        projectId,
        projectEnv,
      },
    },
    {
      $group: {
        _id: "$formName",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "form_settings",
        localField: "_id",
        foreignField: "formName",
        pipeline: [
          {
            $match: {
              projectId,
              projectEnv,
            },
          },
        ],
        as: "formSettings",
      },
    },
    {
      $unwind: {
        path: "$formSettings",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: {
        formName: "$_id",
        count: "$count",
        enabled: "$formSettings.enabled",
      },
    },
  ]);

  const list: FormDetails[] = [];

  for await (const doc of cursor) {
    const formSettings = await getFormSettings(
      projectId,
      projectEnv,
      doc.formName
    );

    list.push({
      formName: doc.formName,
      submissionCount: doc.count,
      enabled: Boolean(formSettings && formSettings.enabled),
    });
  }

  return list;
}
