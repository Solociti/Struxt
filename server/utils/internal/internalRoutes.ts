export type HostRoutes = {
  "editor-api": EditorApiRoutes;
  "function-runner": FunctionRunnerRoutes;
};

export type AnyInternalRoutes = EditorApiRoutes | FunctionRunnerRoutes;

export interface EditorApiRoutes {
  "/routines/logs/append": {
    request: {
      executionId: string;

      /**
       * Shows the source of the log
       */
      source: "system" | "script";

      type: "error" | "info" | "warn";

      message: string;
    };
    response: { success: boolean };
  };

  "/routines/db/find": {
    request: {
      collection: string;

      query: any;
    };
    response: { docs: any[] };
  };

  "/routines/db/update": {
    request: {
      collection: string;

      query: any;
      update: any;
    };
    response: { updated: number; upserted: number };
  };
}

export interface FunctionRunnerRoutes {
  "/routines/exec": {
    request: {
      /**
       * The execution id of the process
       */
      executionId: string;

      /**
       * The code to execute
       */
      exec: string;

      /**
       * The entry point of the process
       */
      entryPoint: string;

      /**
       * The amount of time to wait till the process is killed.
       */
      timeout: number;
    };
    response: any;
  };
}
