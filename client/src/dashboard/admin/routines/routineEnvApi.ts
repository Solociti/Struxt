import { getApi, postApi } from "client/api/api";
import {
  RoutineEnvApi,
  RoutineEnvListApi,
} from "common/api/routines/routineEnvApi";
import { RoutineEnvModel } from "common/models/routines/RoutineEnv";

/**
 * Get the list of routine environments from the server
 */
export async function getRoutineEnvList(): Promise<RoutineEnvModel[]> {
  const response = await getApi<RoutineEnvListApi>(["/api/routines/env/list"]);
  return response.envs.map((e: RoutineEnvModel) => new RoutineEnvModel(e));
}

/**
 * Get a single routine environment by its Fission name
 *
 * @param name `node-22`
 */
export async function getRoutineEnvByName(
  name: string,
): Promise<RoutineEnvModel> {
  const response = await getApi<RoutineEnvApi>(["/api/routines/env"], { name });
  return new RoutineEnvModel(response.env);
}

/**
 * Get a single routine environment by its uuid
 *
 * @param uuid
 */
export async function getRoutineEnvByUuid(
  uuid: string,
): Promise<RoutineEnvModel> {
  const response = await getApi<RoutineEnvApi>(["/api/routines/env"], { uuid });
  return new RoutineEnvModel(response.env);
}

/**
 * Save a routine environment to the server
 *
 * @param env
 */
export async function saveRoutineEnv(env: RoutineEnvModel) {
  return await postApi<RoutineEnvApi>(["/api/routines/env"], { env });
}
