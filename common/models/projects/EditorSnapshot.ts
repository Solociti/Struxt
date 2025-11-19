import { Model, UserModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";
import { EditorData } from "./editorDataTypes";
import { EnvironmentTypes } from "./Environment";

export class EditorSnapshotModel extends Model {
  /**
   * The project id
   *
   * Use projectId + snapshotTime + publishType to create a unique key
   */
  public projectId: string = "";

  /**
   * Round off the time to the desired snapshot interval.
   *
   * Use this as a key with the projectId so we can auto compact while inserting
   */
  public snapshotTime: number = 0;

  /**
   * When this snapshot is created before a publish,
   * this is the environment that the publish happened in.
   *
   * If it's a save, set to "save"
   */
  public eventType: EnvironmentTypes | "save" = "save";

  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  public restored: UserModelAction = {
    active: false,
    date: 0,
    userId: "",
    displayName: "",
  };

  /**
   * Prevents purging this snapshot when it is locked
   */
  public locked: UserModelAction = {
    active: false,
    date: 0,
    userId: "",
    displayName: "",
  };

  public editorData: EditorData = {
    assets: [],
    styles: [],
    pages: [],
    symbols: [],
    dataSources: [],
    custom: {
      projectType: "site",
      id: "",
    },
  };

  constructor(data?: DeepPartial<EditorSnapshotModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<EditorSnapshotModel>) {
    if (data.editorData) {
      // don't run the mergeDeep on editorData.
      // this could cause multiple versions of the data being merged
      this.editorData = data.editorData as EditorData;
    }

    mergeDeep(this, data, ["editorData"]);
  }

  clone(): EditorSnapshotModel {
    const data = JSON.parse(JSON.stringify(this));
    return new EditorSnapshotModel(data);
  }
}
