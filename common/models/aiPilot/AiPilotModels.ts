import { Model as BaseModel, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "../utils";

export class AiPilotModel extends BaseModel {
  /**
   * The unique identifier for this model.
   *
   * `vendor:model-name`
   */
  public id: string = "";

  /**
   * The vendor display name
   */
  public vendor: string = "";

  /**
   * The model display name
   */
  public modelName: string = "";

  /**
   * The token multiplier is used when calculating user usage.
   * Higher priced models should have a higher token multiplier and thus consume the user quota faster.
   */
  public tokenMultiplier: number = 1;

  /**
   * Whether this model is the default selection in the UI.
   */
  public isDefault: boolean = false;

  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  public disabled: UserModelAction = {
    active: false,
    date: 0,
    userId: "",
    displayName: "",
  };

  constructor(data?: DeepPartial<AiPilotModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<AiPilotModel>) {
    mergeDeep(this, data);
  }

  clone(): AiPilotModel {
    const data = JSON.parse(JSON.stringify(this));
    return new AiPilotModel(data);
  }

  /**
   * Split the id into vendor and model components
   *
   * @returns
   */
  splitId() {
    const [vendor, model] = this.id.split(":");
    return { vendor, model };
  }
}
