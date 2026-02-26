import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import { Api } from "../api";

export interface RoutineEnvListApi extends Api {
  Endpoint: "/api/routines/env/list";

  GetQuery: {};
  GetResponse: { envs: RoutineEnvModel[] };
}

export interface RoutineEnvApi extends Api {
  Endpoint: "/api/routines/env";

  GetQuery: { name: string } | { uuid: string };
  GetResponse: { env: RoutineEnvModel };

  PostBody: { env: RoutineEnvModel };
  PostResponse: { success: boolean; uuid: string };
}
