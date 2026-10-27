import { Model, UserModelAction } from "common/models/Model";
import { RoutineEnvModel } from "../routines/RoutineEnv";
import { DeepPartial, mergeDeep } from "../utils";
import { EditorData } from "./editorDataTypes";
import { ProjectEnvSettings, setupProjectEnvSettings } from "./Environment";
import {
  createCronTrigger,
  createHttpTrigger,
  CronTrigger,
  HttpTrigger,
} from "./Triggers";

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
   * The type of context item
   */
  type: "facts" | "preferences" | "decisions" | "context" | "style";

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

export interface ProjectFeatureFlags {
  aiPilot: {
    enabled: boolean;
    settings: {
      monthlyAllowance: number;
    };
  };
  routines: {
    enabled: boolean;
    environments: Pick<RoutineEnvModel, "uuid" | "files" | "ignore">[];

    /**
     * The list of http triggers for the project.
     */
    httpTriggers: HttpTrigger[];

    /**
     * The list of cron triggers for the project.
     */
    cronTriggers: CronTrigger[];
  };
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
   * Feature flags for the project
   */
  public featureFlags: ProjectFeatureFlags = {
    aiPilot: {
      enabled: false,
      settings: {
        monthlyAllowance: 0,
      },
    },
    routines: {
      enabled: false,
      environments: [],
      httpTriggers: [],
      cronTriggers: [],
    },
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

    if (data.featureFlags?.routines?.environments) {
      this.featureFlags.routines.environments =
        data.featureFlags.routines.environments.map((env) => {
          const original: ProjectFeatureFlags["routines"]["environments"][number] =
            {
              uuid: "",
              files: [],
              ignore: [],
            };

          return Object.assign(original, env);
        });
    }

    if (data.featureFlags?.routines?.httpTriggers) {
      this.featureFlags.routines.httpTriggers =
        data.featureFlags.routines.httpTriggers.map((trigger) =>
          createHttpTrigger(trigger),
        );
    }

    if (data.featureFlags?.routines?.cronTriggers) {
      this.featureFlags.routines.cronTriggers =
        data.featureFlags.routines.cronTriggers.map((trigger) =>
          createCronTrigger(trigger),
        );
    }

    mergeDeep(this, data, [
      "staging",
      "production",
      "editorData",
      "featureFlags.routines.environments",
      "featureFlags.routines.httpTriggers",
      "featureFlags.routines.cronTriggers",
    ]);
  }

  clone(): ProjectModel {
    const data = JSON.parse(JSON.stringify(this));
    return new ProjectModel(data);
  }

  static createContextItem(
    data: DeepPartial<ProjectContextItem>,
  ): ProjectContextItem {
    const date = Math.floor(Date.now() / 1000);
    const item: ProjectContextItem = {
      key: "",
      value: "",
      type: "context",
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
