import { customError } from "common/custom-error/custom-error";
import { ProjectModel } from "common/models/projects/ProjectModel";
import {
  PublishModel,
  PublishRoutineItem,
} from "common/models/projects/PublishModel";
import { createReadStream, createWriteStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { getTempDir } from "server/utils/uploadDir";
import { getRoutineEnv } from "../env/getRoutineEnv";
import { uploadArchive } from "../fission/archive";
import { createPackage } from "../fission/package";
import { createRoutineZip } from "./createRoutineZip";

/**
 * Publish the routines for the given project and environment.
 *
 * @param project
 * @param publish
 * @param projectEnv
 */
export async function publishRoutines(
  project: ProjectModel,
  publish: PublishModel,
) {
  const { environments } = project.featureFlags.routines;

  const process: (() => Promise<void>)[] = [];

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
      uuid: `${routineEnv.runtime}-${publish.createNextRoutineId()}`,
      routineUuid: env.uuid,
      assetIds: [],
    };
    publish.routines.push(publishValue);

    process.push(async () => {
      // Create a zip stream to upload to the fission archive
      const { stream: zipStream, assets } = await createRoutineZip(
        project,
        env,
      );
      publishValue.assetIds = assets.map((a) => a.uuid);

      const tempFile = getTempDir(
        project.projectId,
        `${publishValue.uuid}.zip`,
      );
      await pipeline(zipStream, createWriteStream(tempFile));

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

      await createPackage({
        environmentName: routineEnv.name,
        sourceArchiveId: archiveId,
        name: publishValue.uuid,
      });

      // TODO: setup all endpoints/entrypoints for the routines in fission
      // TODO: use this information from assets
    });
  }

  // TODO: setup cleanup scripts if something goes wrong during the publish process

  return await Promise.all(process.map((fn) => fn()));
}
