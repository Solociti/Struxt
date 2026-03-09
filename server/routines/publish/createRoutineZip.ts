import { AssetModel } from "common/models/assets/AssetModel";
import {
  ProjectFeatureFlags,
  ProjectModel,
} from "common/models/projects/ProjectModel";
import { glob } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { getAssetByPath } from "server/api/assets/getAssets";
import { createZipStream } from "server/hfs/zipStream";
import { getProjectFilesDir } from "server/utils/uploadDir";

/**
 * Creates a zip file stream of the routines for the given project and fission env
 *
 * @param projectId
 * @param fissionEnv
 */
export async function createRoutineZip(
  project: ProjectModel,
  fissionEnv: ProjectFeatureFlags["routines"]["environments"][number],
) {
  const dir = getProjectFilesDir(project.projectId);

  // TODO: collect the asset metadata while creating the list
  const assets: AssetModel[] = [];
  const files = await collectFiles(dir, fissionEnv.files, fissionEnv.ignore);

  // ! temporary hack to get the asset metadata. This must be removed and a proper way built instead of globing the file system
  for (const file of files) {
    const asset = await getAssetByPath(project.projectId, file);
    if (asset) {
      assets.push(asset);
    }
  }

  const res = await createZipStream(files, {
    restrictedTo: dir,
    relativeTo: dir,
  });

  return {
    ...res,
    assets,
  };
}

/**
 * Recursively collects files from the given root directory that match the specified patterns
 * and do not match the ignore patterns.
 *
 * @param rootDir
 * @param match
 * @param ignore
 */
export async function collectFiles(
  rootDir: string,
  match: string[],
  ignore: string[],
): Promise<string[]> {
  const files = new Set<string>();

  // TODO: use the mongodb collection of assets to create the list of files instead of globbing the file system
  // Potentially use glob-to-regexp to convert the glob patterns to regex.

  const matchList = match
    .map((pattern) => {
      if (isAbsolute(pattern)) {
        return pattern.replace(/^\/+/, "");
      }
      return pattern;
    })
    .filter(Boolean);
  const ignoreList = ignore
    .map((pattern) => {
      if (isAbsolute(pattern)) {
        return pattern.replace(/^\/+/, "");
      }
      return pattern;
    })
    .filter(Boolean);

  for await (const file of glob(matchList, {
    cwd: rootDir,
    exclude: ignoreList,
  })) {
    if (isAbsolute(file)) {
      files.add(file);
    } else {
      files.add(join(rootDir, file));
    }
  }

  return Array.from(files);
}
