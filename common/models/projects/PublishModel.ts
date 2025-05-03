import { Model, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "common/models/utils";
import { EnvironmentTypes } from "./Environment";

export class PublishModel extends Model {
  /**
   * The publish db id
   */
  public uuid: string = "";

  /**
   * The project this publish belongs to
   */
  public projectId: string = "";

  /**
   * The environment this publish is for
   */
  public siteEnv: EnvironmentTypes = "staging";

  /**
   * Tells if this is the active publish for this project + env combination
   */
  public isActive: boolean = false;

  /**
   * The screenshot for this publish
   */
  public screenshotUrl: string = "";

  // setup the dates
  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  constructor(data?: DeepPartial<PublishModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<PublishModel>) {
    mergeDeep(this, data);
  }

  clone(): PublishModel {
    const data = JSON.parse(JSON.stringify(this));
    return new PublishModel(data);
  }
}
