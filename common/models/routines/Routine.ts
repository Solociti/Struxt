import { Model, UserModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";

export interface RoutineListItem {
  uuid: string;
  name: string;
  path: string;
  updated: Omit<UserModelAction, "active">;
}

export class RoutineModel extends Model {
  /**
   * The unique identifier for the routine.
   */
  public uuid: string = "";

  /**
   * The name of the routine.
   *
   * @example `test_routine.js`
   */
  public name: string = "";

  /**
   * The virtual path location where the routine is located.
   *
   * @example `/test/`
   */
  public path: string = "";

  /**
   * The contents of the routine.
   */
  public contents: string = "";

  public created: Omit<UserModelAction, "active"> = {
    userId: "",
    displayName: "",
    date: Math.floor(Date.now() / 1000),
  };

  public updated: Omit<UserModelAction, "active"> = {
    userId: "",
    displayName: "",
    date: Math.floor(Date.now() / 1000),
  };

  constructor(data?: DeepPartial<RoutineModel>) {
    super();

    if (data) {
      this.assign(data);
    }
  }

  assign(data: DeepPartial<RoutineModel>) {
    mergeDeep(this, data);
  }
}
