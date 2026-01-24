import { AssetModel } from "common/models/assets/AssetModel";
import { DataPropsOnly } from "common/models/Model";
import { Filter } from "mongodb";
import { isAbsolute, matchesGlob, normalize } from "node:path";
import { getCollection } from "server/database/mongodb";

const blackListPathGlobs = [
  "/.trash",
  "/.trash/**",
  "/external",
  "/public",
  "/public/assets",
  "/routines",
];

/**
 * Check if the given path is unique for the given project.
 *
 * @param projectId
 * @param uuid
 * @param path
 */
export async function isAssetPathUnique(
  projectId: string,
  uuid: string,
  path: string,
) {
  if (!isAbsolute(path)) {
    return false;
  }

  path = normalize(path);
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  // @ts-ignore
  const escapedPath = RegExp.escape(path);
  const regexStr = `^${escapedPath}\/`;

  // check if the path is in the blacklist
  for (const pattern of blackListPathGlobs) {
    if (matchesGlob(path, pattern)) {
      return false;
    }
  }

  const filter: Filter<DataPropsOnly<AssetModel>> = {
    projectId,
    $or: [{ path }, { path: { $regex: regexStr } }],
  };
  if (uuid) {
    filter.uuid = { $ne: uuid };
  }

  const collection = await getCollection<AssetModel>("assets");
  const doc = await collection.findOne(filter, { projection: { _id: 1 } });

  return !doc;
}

// setTimeout(async () => {
//   const testPaths = {
//     "/public/assets/logo.png": true,
//     "/public/assets": false,
//     "/public/assets/bbq-chicken.jpg": false,
//     "/routines/": false,
//     "/external/": false,
//     "/routines/test.js": true,
//     "/.trash/test.js": false,
//     "/.trash/": false,
//   };

//   for (const path in testPaths) {
//     const result = await isAssetPathUnique("0008-mfptwsjw", "", path);
//     // @ts-ignore
//     console.log(testPaths[path] === result ? "PASS" : "FAIL", path);
//   }
// }, 5000);
