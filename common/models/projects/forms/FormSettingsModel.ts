import { Model, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "common/models/utils";
import { EnvironmentTypes } from "../Environment";

export interface FormSettingsField {
  /**
   * the field name
   */
  name: string;
  /**
   * the type of data to expect.
   *
   * In most cases this is the `input type`
   */
  type: "text" | "number" | "email" | "tel" | "boolean";

  /**
   * Tells if the field is required or not
   */
  required: boolean;
}

export class FormSettingsModel extends Model {
  /**
   * The project id this form is associated with
   *
   * projectId + projectEnv + formName = unique
   */
  public projectId: string = "";

  /**
   * The published environment
   *
   * projectId + projectEnv + formName = unique
   */
  public projectEnv: EnvironmentTypes = "staging";

  /**
   * the form name
   *
   * projectId + projectEnv + formName = unique
   */
  public formName: string = "";

  /**
   * Tells if the form is enabled or not
   */
  public enabled: boolean = false;

  /**
   * Email settings
   */
  public email: {
    send: boolean;
    to: string;
    subject: string;
  } = {
    send: false,
    to: "",
    subject: "",
  };

  /**
   * The list of fields in the form
   */
  public fields: FormSettingsField[] = [];

  // setup the dates
  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  public updated: Omit<UserModelAction, "active"> = {
    date: 0,
    userId: "",
    displayName: "",
  };

  constructor(data?: DeepPartial<FormSettingsModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<FormSettingsModel>) {
    if (data.fields) {
      this.updateFields(data.fields as FormSettingsField[]);
    }

    mergeDeep(this, data, ["fields"]);
  }

  clone(): FormSettingsModel {
    const data = JSON.parse(JSON.stringify(this));
    return new FormSettingsModel(data);
  }

  /**
   * Update the fields inside this form
   *
   * @param fields
   */
  updateFields(fields: FormSettingsField[]) {
    this.fields = fields.map((field) => {
      const data: FormSettingsField = {
        name: "",
        type: "text",
        required: false,
      };

      return Object.assign(data, field);
    });
  }
}
