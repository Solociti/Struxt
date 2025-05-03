import { Model, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "../utils";
import { EditorData } from "./editorDataTypes";
import {
  EnvironmentTypes,
  ProjectDomain,
  ProjectEnvSettings,
  setupProjectEnvSettings,
} from "./Environment";

export interface ProjectEditorData {
  /**
   * The project db id
   */
  projectId: string;

  /**
   * The project name
   */
  name: string;

  /**
   * The GrapesJS editor data
   */
  editorData: EditorData;
}

export class ProjectModel extends Model {
  /**
   * The project db id
   */
  public projectId: string = "";

  /**
   * The old id imported from mariadb
   */
  public oldId?: string;

  /**
   * Set to true to indicate that this project the default site for the editor
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
   * The storage settings for the project
   */
  public storage: {
    maxBytes: number;
  } = {
    maxBytes: 0,
  };

  /**
   * The GrapesJS editor data
   */
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

    if (data.editorData) {
      // don't run the mergeDeep on editorData.
      // this could cause multiple versions of the data being merged
      this.editorData = data.editorData as EditorData;
    }

    mergeDeep(this, data, ["staging", "production", "editorData"]);
  }

  clone(): ProjectModel {
    const data = JSON.parse(JSON.stringify(this));
    return new ProjectModel(data);
  }

  /**
   * Get the primary domain for the given environment
   *
   * @param env
   * @returns
   */
  getPrimaryDomain(env: EnvironmentTypes): ProjectDomain | null {
    const envSettings = this[env];

    const primaryDomain = envSettings.domains.find((d) => d.isPrimary);
    if (primaryDomain) {
      return primaryDomain;
    }

    // if no primary domain is set, set the first one that starts with www
    const wwwDomain = envSettings.domains.find((d) =>
      d.domain.startsWith("www")
    );
    if (wwwDomain) {
      return wwwDomain;
    }

    // if no primary domain is set, set the first domain
    const firstDomain = envSettings.domains[0];
    if (firstDomain) {
      return firstDomain;
    }

    return null;
  }
}
