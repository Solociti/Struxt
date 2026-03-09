import { Model, ModelAction, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "common/models/utils";
import { EnvironmentTypes } from "./Environment";

export interface PublishRoutineItem {
  /**
   * A unique identifier for this routine item.
   *
   * Concat the publish uuid with a integer index to create it.
   */
  uuid: string;

  /**
   * The uuid of the routine environment this routine belongs to.
   */
  routineUuid: string;

  /**
   * The list of asset uuids that were included in the zip file.
   */
  assetIds: string[];
}

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

  public routines: PublishRoutineItem[] = [];

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

  /**
   * Tells if this publish has been cleared already
   */
  public cleared: ModelAction = {
    active: false,
    date: 0,
  };

  constructor(data?: DeepPartial<PublishModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<PublishModel>) {
    if (data.routines) {
      this.routines = data.routines.map((routine) => {
        const defaultRoutine: PublishRoutineItem = {
          uuid: "",
          routineUuid: "",
          assetIds: [],
        };

        return mergeDeep(defaultRoutine, routine!);
      });
    }

    mergeDeep(this, data, ["routines"]);
  }

  clone(): PublishModel {
    const data = JSON.parse(JSON.stringify(this));
    return new PublishModel(data);
  }

  createNextRoutineId() {
    const index = this.routines.length;
    return `${this.uuid}-${index}`;
  }
}
