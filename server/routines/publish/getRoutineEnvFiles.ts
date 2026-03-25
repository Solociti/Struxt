import { AssetModel } from "common/models/assets/AssetModel";
import { DataPropsOnly } from "common/models/Model";
import {
  ProjectFeatureFlags,
  ProjectModel,
} from "common/models/projects/ProjectModel";
import { Filter } from "mongodb";
import pm from "picomatch";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Resolves the list of asset files to include in a routine environment based on the environment's file match and ignore patterns.
 *
 * @param project
 * @param fissionEnv
 */
export async function getRoutineEnvFiles(
  project: ProjectModel,
  fissionEnv: ProjectFeatureFlags["routines"]["environments"][number],
): Promise<AssetModel[]> {
  const match = fissionEnv.files;
  const ignore = fissionEnv.ignore;

  const matchList = match.filter(Boolean).map((m) => pm.makeRe(m));
  const ignoreList = ignore.filter(Boolean).map((m) => pm.makeRe(m));

  const query: Filter<DataPropsOnly<AssetModel>> = {
    projectId: project.projectId,
    "deleted.active": false,
  };

  if (matchList.length > 0) {
    query.$and = [];
    query.$and.push({
      $or: matchList.map((re) => ({
        path: {
          $regex: re.source,
          $options: re.flags,
        },
      })),
    });
  }

  if (ignoreList.length > 0) {
    if (!query.$and) {
      query.$and = [];
    }
    query.$and.push({
      $nor: ignoreList.map((re) => ({
        path: {
          $regex: re.source,
          $options: re.flags,
        },
      })),
    });
  }

  // create the mongodb query
  const collection = await getCollection<AssetModel>("assets");
  const cursor = collection.find(query);

  const list = await toArray(cursor);

  return list.map((d) => new AssetModel(d));
}
