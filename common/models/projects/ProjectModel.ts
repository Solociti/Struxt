import { Model, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "../utils";
import { EditorData } from "./editorDataTypes";
import { ProjectEnvSettings, setupProjectEnvSettings } from "./Environment";

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

export interface ProjectContextItem {
  /**
   * The key or identifier for the context item
   */
  key: string;

  /**
   * The value or description for the context item
   */
  value: string;

  /**
   * Created information for the context item
   */
  created: Omit<UserModelAction, "active">;

  /**
   * Updated information for the context item
   */
  updated: Omit<UserModelAction, "active">;

  /**
   * Deleted information for the context item
   */
  deleted: UserModelAction;
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
   * Any additional context about the project.
   *
   * This is used to provide additional information to the AI Pilot.
   */
  public context: ProjectContextItem[] = [];

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
   * Get the context for the project, including name and description.
   *
   * @returns
   */
  getContextSummary(): Record<string, string> {
    const _context: Record<string, string> = {};

    if (this.name) {
      _context["name"] = this.name;
    }

    if (this.description) {
      _context["description"] = this.description;
    }

    for (const ctx of this.context) {
      if (ctx.deleted.active) {
        continue;
      }

      _context[ctx.key] = ctx.value;
    }

    return _context;
  }

  static createContextItem(
    data: DeepPartial<ProjectContextItem>
  ): ProjectContextItem {
    const date = Math.floor(Date.now() / 1000);
    const item: ProjectContextItem = {
      key: "",
      value: "",
      created: {
        date,
        userId: "",
        displayName: "",
      },
      updated: {
        date,
        userId: "",
        displayName: "",
      },
      deleted: {
        active: false,
        date: 0,
        userId: "",
        displayName: "",
      },
    };

    return mergeDeep(item, data) as ProjectContextItem;
  }
}
