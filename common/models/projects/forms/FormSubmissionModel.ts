import { Model } from "common/models/Model";
import { DeepPartial, mergeDeep } from "common/models/utils";
import { EnvironmentTypes } from "../Environment";

export class FormSubmissionModel extends Model {
  /**
   * A generated form submission id
   */
  public submissionId: string = "";

  /**
   * the project this form is associated with
   */
  public projectId: string = "";

  /**
   * The environment this form is associated with
   */
  public projectEnv: EnvironmentTypes = "staging";

  /**
   * the form name
   */
  public formName: string = "";

  /**
   * the submitted form data.
   *
   * This data is scrubbed before saving
   */
  public formData: Record<string, any> = {};

  /**
   * A list of documents / images that are attached to the form submission
   */
  public attachments: {
    /**
     * The current file name as saved on the server
     */
    fileName: string;

    /**
     * the original file name as submitted by the user
     */
    originalName: string;

    avStatus: string;
    avResult: string;
  }[] = [];

  /**
   * The ip address of the user submitting the form
   */
  public ipAddress: string = "";

  /**
   * The user agent of the user submitting the form
   */
  public userAgent: string = "";

  /**
   * when a email is sent, save the id of the email
   */
  public sentEmailId: string = "";

  /**
   * the date the form was submitted
   */
  public createdDate: number = Math.floor(Date.now() / 1000);

  constructor(data?: DeepPartial<FormSubmissionModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<FormSubmissionModel>) {
    if (data.attachments) {
      this.attachments = data.attachments.map((attachment) => {
        const data = {
          fileName: "",
          originalName: "",
          avStatus: "pending",
          avResult: "",
        };

        return Object.assign(data, attachment);
      });
    }

    mergeDeep(this, data);
  }

  clone(): FormSubmissionModel {
    const data = JSON.parse(JSON.stringify(this));
    return new FormSubmissionModel(data);
  }
}
