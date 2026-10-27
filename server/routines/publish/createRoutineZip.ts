import { AssetModel } from "common/models/assets/AssetModel";
import {
  ProjectFeatureFlags,
  ProjectModel,
} from "common/models/projects/ProjectModel";
import { createWriteStream, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createZipStream } from "server/hfs/zipStream";
import { mkDirRecursive } from "server/utils/mkDir";
import { getProjectFilesDir } from "server/utils/uploadDir";
import { getRoutineEnvFiles } from "./getRoutineEnvFiles";

/**
 * Creates a zip file stream of the routines for the given project and fission env
 *
 * @param projectId
 * @param fissionEnv
 * @param tempFilePath
 */
export async function createRoutineZip(
  project: ProjectModel,
  fissionEnv: ProjectFeatureFlags["routines"]["environments"][number],
  tempFilePath: string,
) {
  const dir = getProjectFilesDir(project.projectId);

  const assets: AssetModel[] = await getRoutineEnvFiles(project, fissionEnv);
  const files: { asset: AssetModel; file: string }[] = [];

  for (const asset of assets) {
    const file = join(dir, asset.path);

    if (existsSync(file)) {
      files.push({ asset, file });
    }
  }

  await mkDirRecursive(dirname(tempFilePath));

  const res = await createZipStream(
    files.map((f) => f.file),
    {
      restrictedTo: dir,
      relativeTo: dir,
    },
  );

  await pipeline(res.stream, createWriteStream(tempFilePath));

  return {
    assets: files.map((f) => f.asset),
    tempFilePath,
  };
}
