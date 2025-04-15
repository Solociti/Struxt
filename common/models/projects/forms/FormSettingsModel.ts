import { Model, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "common/models/utils";
import { EnvironmentTypes } from "../Environment";

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
   * The list of fields in the form
   */
  public fields: {
    name: string;
    type: string;
    required: boolean;
  }[] = [];

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
      this.fields = data.fields.map((field) => {
        const data = {
          name: "",
          type: "text",
          required: false,
        };

        return Object.assign(data, field);
      });
    }

    mergeDeep(this, data, ["fields"]);
  }

  clone(): FormSettingsModel {
    const data = JSON.parse(JSON.stringify(this));
    return new FormSettingsModel(data);
  }
}
