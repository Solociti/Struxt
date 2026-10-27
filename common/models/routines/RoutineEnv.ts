import { Model, ModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";
import { FissionRuntimes } from "./runtimes";

export class RoutineEnvModel extends Model {
  /**
   * The unique identifier for the routine environment.
   */
  public uuid: string = "";

  /**
   * The name of the routine environment as setup in the Fission CLI.
   */
  public name: string = "";

  /**
   * Used when displaying the routine environment in the UI.
   */
  public displayName: string = "";

  /**
   * The runtime of the routine environment, e.g. "nodejs", "python", etc.
   */
  public runtime: FissionRuntimes = "nodejs";

  /**
   * Only 1 per runtime can be set as default.
   */
  public isDefault: boolean = false;

  /**
   * A list of files patterns to match when creating the fission package.
   */
  public files: string[] = [];

  /**
   * List of file patterns to ignore.
   *
   * If a file also matches the include, it'll still be ignored.
   */
  public ignore: string[] = [];

  /**
   * Tells if the environment is disabled.
   *
   * Cannot deploy to disabled environments.
   */
  public disabled: ModelAction = {
    active: false,
    date: 0,
  };

  constructor(data?: DeepPartial<RoutineEnvModel>) {
    super();
    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<RoutineEnvModel>) {
    mergeDeep(this, data);
  }

  clone(): RoutineEnvModel {
    return new RoutineEnvModel(JSON.parse(JSON.stringify(this)));
  }
}
