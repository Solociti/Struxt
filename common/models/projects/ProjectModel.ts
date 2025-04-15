import { Model, UserModelAction } from "common/models/Model";
import { ProjectEnvSettings, setupProjectEnvSettings } from "./Environment";
import { DeepPartial, mergeDeep } from "../utils";

export class ProjectModel extends Model {
  /**
   * The project db id
   */
  public projectId: string = "";

  public oldId?: string;

  /**
   * Set to true to indicate that this project is a site editor
   */
  public isEditorSite?: boolean;

  /**
   * The project name
   */
  public name: string = "";

  /**
   * A description for the project
   */
  public description: string = "";

  /**
   * The GrapesJS editor data
   */
  public editorData: any = {};

  /**
   * Staging specific settings
   */
  public staging: ProjectEnvSettings = setupProjectEnvSettings({});

  /**
   * Production specific settings
   */
  public production: ProjectEnvSettings = setupProjectEnvSettings({});

  // setup the project dates

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

  constructor(data?: DeepPartial<ProjectModel>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<ProjectModel>) {
    if (data.staging) {
      this.staging = setupProjectEnvSettings(data.staging);
    }

    if (data.production) {
      this.production = setupProjectEnvSettings(data.production);
    }

    mergeDeep(this, data, ["staging", "production"]);
  }

  clone(): ProjectModel {
    const data = JSON.parse(JSON.stringify(this));
    return new ProjectModel(data);
  }
}
