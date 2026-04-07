import { customError } from "common/custom-error/custom-error";
import { AssetModel } from "common/models/assets/AssetModel";
import { ProjectModel } from "common/models/projects/ProjectModel";
import {
  PublishModel,
  PublishRoutineItem,
} from "common/models/projects/PublishModel";
import { createReadStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { basename, dirname, extname, join, normalize } from "node:path";
import { getTempDir } from "server/utils/uploadDir";
import { getRoutineEnv } from "../env/getRoutineEnv";
import { uploadArchive } from "../fission/archive";
import { createFunction } from "../fission/function";
import { createHttpTrigger } from "../fission/httptrigger";
import { createPackage } from "../fission/package";
import { createTimeTrigger } from "../fission/timetrigger";
import { createRoutineZip } from "./createRoutineZip";

export const fissionPrefix = process.env.FISSION_NAME_PREFIX || "struxt";

/**
 * Creates a key used to deduplicate function resources per asset handler.
 *
 * @param assetId
 * @param handler
 */
function getFunctionKey(assetId: string, handler: string): string {
  return `${assetId}:${handler}`;
}

/**
 * Resolves the package handler value for a trigger.
 *
 * @param asset
 * @param handler
 */
function resolvePackageHandler(asset: AssetModel, handler: string): string {
  const extension = extname(asset.path);
  const moduleName = basename(asset.path, extension);
  const dir = dirname(asset.path);

  if (!moduleName) {
    throw customError(
      400,
      `Invalid asset path '${asset.path}' for routine trigger handler resolution.`,
    );
  }

  // NOTE: dir must be included — Fission resolves entrypoints relative to the
  // archive root, so the full subpath (e.g. "routines/hello-world") is required.
  if (!handler || handler === "default") {
    return join(dir, moduleName);
  }

  return `${join(dir, moduleName)}.${handler}`;
}

/**
 * Resolves or creates a Fission Function resource and returns its resource name.
 *
 * @param assetId
 * @param handler
 * @param assetsById
 * @param existingFunctions
 * @param publishValue
 * @param routineEnvName
 */
async function resolveFunctionResourceName(
  assetId: string,
  handler: string,
  assetsById: Map<string, AssetModel>,
  existingFunctions: Map<string, string>,
  publishValue: PublishRoutineItem,
  routineEnvName: string,
): Promise<string> {
  const key = getFunctionKey(assetId, handler);
  const existingName = existingFunctions.get(key);
  if (existingName) {
    return existingName;
  }

  const asset = assetsById.get(assetId);
  if (!asset) {
    throw customError(
      400,
      `Unable to resolve routine trigger asset '${assetId}' in publish archive.`,
    );
  }

  const functionResourceName = `${publishValue.uuid}-fn-${existingFunctions.size}`;
  const functionName = resolvePackageHandler(asset, handler);

  try {
    await createFunction({
      name: functionResourceName,
      environmentName: routineEnvName,
      packageName: publishValue.uuid,
      functionName,
      labels: { deploy: publishValue.uuid },
    });
  } catch (err) {
    console.error(`Failed to Create Function: ${functionResourceName}`, err);
    throw customError(
      500,
      "Failed to create a routine function while publishing. Please retry or contact support if the issue persists.",
    );
  }

  existingFunctions.set(key, functionResourceName);
  return functionResourceName;
}

/**
 * Publish the routines for the given project and environment.
 *
 * @param project
 * @param publish
 */
export async function publishRoutines(
  project: ProjectModel,
  publish: PublishModel,
) {
  const { environments } = project.featureFlags.routines;

  const processEnvs: (() => Promise<void>)[] = [];

  for (const env of environments) {
    const routineEnv = await getRoutineEnv(env.uuid);
    if (!routineEnv) {
      continue;
    }

    if (routineEnv.disabled.active) {
      throw customError(
        403,
        `Environment '${routineEnv.name}' was disabled by an admin. Cannot publish.`,
      );
    }

    // if the files array is empty, use the default files from the routine environment
    if (env.files.length === 0) {
      env.files.push(...routineEnv.files);
      if (env.ignore.length === 0) {
        // only use the default ignore, if files and ignore arrays are empty
        env.ignore.push(...routineEnv.ignore);
      }
    }

    const publishValue: PublishRoutineItem = {
      uuid: `${fissionPrefix}-${routineEnv.runtime}-${publish.createNextRoutineId()}`,
      routineUuid: env.uuid,
      assetIds: [],
      httpTriggers: [],
      cronTriggers: [],
    };
    publish.routines.push(publishValue);

    processEnvs.push(async () => {
      const tempFile = getTempDir(
        project.projectId,
        `${publishValue.uuid}.zip`,
      );

      // Create a zip stream to upload to the fission archive
      const { assets } = await createRoutineZip(project, env, tempFile);
      if (assets.length === 0) {
        throw customError(
          400,
          `No assets found for environment '${routineEnv.displayName}'. Cannot publish.`,
        );
      }
      publishValue.assetIds.push(...assets.map((a) => a.uuid));
      const assetsById = new Map<string, AssetModel>(
        assets.map((asset) => [asset.uuid, asset]),
      );

      const st = await stat(tempFile);
      if (st.size === 0) {
        throw customError(500, "Failed to create routine archive");
      }
      const readStream = createReadStream(tempFile);

      const { id: archiveId } = await uploadArchive(
        readStream,
        `${publishValue.uuid}.zip`,
        st.size,
      );

      // remove the temp file after upload
      await rm(tempFile);

      try {
        await createPackage({
          environmentName: routineEnv.name,
          sourceArchiveId: archiveId,
          name: publishValue.uuid,
          labels: { deploy: publishValue.uuid },
        });
      } catch (err) {
        console.error(`Failed to Create Package: ${publishValue.uuid}`, err);
        throw customError(
          500,
          "Failed to create the routine package while publishing. Please retry or contact support if the issue persists.",
        );
      }

      const functionResources = new Map<string, string>();

      let count = 0;

      for (const httpTrigger of project.featureFlags.routines.httpTriggers) {
        if (httpTrigger.environmentId !== env.uuid) {
          continue;
        }

        // validate that the endpoint doesn't contain path traversal characters
        const endpoint = normalize(httpTrigger.endpoint);
        if (endpoint.startsWith("..")) {
          throw customError(
            400,
            `Invalid HTTP trigger endpoint '${httpTrigger.endpoint}' for routine '${routineEnv.displayName}'. Endpoint cannot contain path traversal characters.`,
          );
        }

        const name = `${publishValue.uuid}-http-${count++}`;
        publishValue.httpTriggers.push(name);

        const handler = httpTrigger.handler.trim() || "default";
        const functionResourceName = await resolveFunctionResourceName(
          httpTrigger.assetId,
          handler,
          assetsById,
          functionResources,
          publishValue,
          routineEnv.name,
        );

        try {
          await createHttpTrigger({
            name,
            relativeUrl: publish.createHttpEndpointTrigger(
              httpTrigger.endpoint,
              fissionPrefix,
            ),
            methods: [httpTrigger.method],
            functionName: functionResourceName,
            labels: { deploy: publishValue.uuid },
          });
        } catch (err) {
          console.error(`Failed to Create HTTP Trigger: ${name}`, err);
          throw customError(
            500,
            "Failed to create an HTTP trigger while publishing. Please retry or contact support if the issue persists.",
          );
        }
      }

      for (const cronTrigger of project.featureFlags.routines.cronTriggers) {
        if (cronTrigger.environmentId !== env.uuid) {
          continue;
        }

        const name = `${publishValue.uuid}-cron-${count++}`;
        publishValue.cronTriggers.push(name);

        const handler = cronTrigger.handler.trim() || "default";
        const functionResourceName = await resolveFunctionResourceName(
          cronTrigger.assetId,
          handler,
          assetsById,
          functionResources,
          publishValue,
          routineEnv.name,
        );

        try {
          await createTimeTrigger({
            name,
            cron: cronTrigger.cronExpression,
            functionName: functionResourceName,
            labels: { deploy: publishValue.uuid },
          });
        } catch (err) {
          console.error(`Failed to Create Cron Trigger: ${name}`, err);
          throw customError(
            500,
            "Failed to create a Cron trigger while publishing. Please retry or contact support if the issue persists.",
          );
        }
      }
    });
  }

  // TODO: setup cleanup scripts if something goes wrong during the publish process

  return await Promise.all(processEnvs.map((fn) => fn()));
}
