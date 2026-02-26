import {
  RoutineEnvApi,
  RoutineEnvListApi,
} from "common/api/routines/routineEnvApi";
import { customError } from "common/custom-error/custom-error";
import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import { fissionRuntimes } from "common/models/routines/runtimes";
import { roles } from "common/models/user/Roles";
import {
  getRoutineEnv,
  getRoutineEnvByName,
  getRoutineEnvList,
} from "server/routines/env/getRoutineEnv";
import { saveRoutineEnv } from "server/routines/env/saveRoutineEnv";
import { getEnvironment } from "server/routines/fission/environment";
import { createSimpleId } from "server/utils/createId";
import z from "zod";
import { registerApi } from "../registerApi";

registerApi<RoutineEnvListApi>("/api/routines/env/list").get(
  [roles.struxt.editor],
  async () => {
    const envs = await getRoutineEnvList();
    return { envs };
  },
);

registerApi<RoutineEnvApi>("/api/routines/env")
  .get([roles.struxt.editor], async ({ query }) => {
    const parsed = z
      .object({
        name: z.string(),
      })
      .or(
        z.object({
          uuid: z.string(),
        }),
      )
      .parse(query);

    if ("uuid" in parsed) {
      const env = await getRoutineEnv(parsed.uuid);

      if (!env) {
        throw customError(404, "Routine environment not found");
      }

      return { env };
    }

    const env = await getRoutineEnvByName(parsed.name);

    if (!env) {
      throw customError(404, "Routine environment not found");
    }

    return { env };
  })
  .post([roles.struxt.admin], async ({ body }) => {
    const parsed = z
      .object({
        env: z.object({
          uuid: z.string().optional(),
          name: z.string(),
          displayName: z.string(),
          isDefault: z.boolean(),
          disabled: z.object({
            active: z.boolean(),
            date: z.number(),
          }),
          runtime: z.enum(fissionRuntimes),
          files: z.array(z.string()),
          ignore: z.array(z.string()),
        }),
      })
      .parse(body);

    const env = new RoutineEnvModel(parsed.env);

    // check if the fission environment is actually setup
    const existingEnv = await getEnvironment(env.name);
    if (!existingEnv) {
      throw customError(
        400,
        `Fission environment ${env.name} does not exist. Please create it in Fission before creating the routine environment.`,
      );
    }

    if (!env.uuid) {
      env.uuid = await createSimpleId("routine");
    }

    await saveRoutineEnv(env);
    return { success: true, uuid: env.uuid };
  });
