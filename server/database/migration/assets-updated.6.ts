import { AssetModel } from "common/models/assets/AssetModel";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { existsSync, lstatSync } from "node:fs";
import { lstat, readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import { createSimpleId } from "server/utils/createId";
import { mkDirRecursive } from "server/utils/mkDir";
import {
  getAssetDir,
  getProjectPublicDir,
  getProjectsParentDir,
} from "server/utils/uploadDir";
import { createIndex, getCollection, toArray } from "../mongodb";

export async function up() {
  await createIndex(
    "assets",
    {
      uuid: 1,
    },
    {
      name: "unique",
      unique: true,
    },
    false
  );

  await createIndex(
    "assets",
    {
      projectId: 1,
      path: 1,
    },
    {
      name: "unique-file-path",
      unique: true,
    },
    false
  );

  // move all of the assets from the old directory to the new directory
  await moveAssets();
}

export async function down() {}

async function moveAssets() {
  const parentDir = getProjectsParentDir();

  // get the list of project ids
  const pCollection = await getCollection<ProjectModel>("projects");
  const projectListCursor = pCollection.find(
    {},
    {
      projection: { projectId: 1, editorData: 1 },
    }
  );
  const projectList = await toArray<
    Pick<ProjectModel, "projectId" | "editorData">
  >(projectListCursor);

  const assetCollection = await getCollection<AssetModel>("assets");

  for (const project of projectList) {
    const projectId = project.projectId;

    const oldDir = join(parentDir, projectId);
    const newDir = getProjectPublicDir(projectId);
    const newAssetDir = getAssetDir(projectId);

    await mkDirRecursive(newAssetDir);

    const assets: AssetModel[] = [];

    // setup editor data
    const editorData = project.editorData;

    // iterate through the assets directory
    const files = await readdir(oldDir);
    for (const file of files) {
      try {
        const oldPath = join(oldDir, file);
        const newAssetPath = join(newAssetDir, file);

        // get the file creation date
        const stats = await lstat(oldPath);
        const date = Math.floor(stats.birthtimeMs / 1000);

        // skip directories
        if (stats.isDirectory()) {
          continue;
        }

        await rename(oldPath, newAssetPath);

        const uuid = await createSimpleId("asset");
        const fullPath = `/assets/${file}`;

        const asset = new AssetModel({
          uuid,
          projectId: projectId,
          path: fullPath,
          displayName: file,
          isExternalSrc: false,
          created: { date },
          updated: {
            date: Math.floor(Date.now() / 1000),
          },
          size: stats.size,
        });
        assets.push(asset);

        updateAssetUrl(asset, editorData);
      } catch (err) {
        console.log(err);
      }
    }

    for (const editorAsset of editorData.assets) {
      if (
        editorAsset.src.startsWith("http://") ||
        editorAsset.src.startsWith("https://")
      ) {
        const fullPath = editorAsset.src;
        const uuid = await createSimpleId("asset");

        const asset = new AssetModel({
          uuid,
          projectId,
          path: fullPath,
          displayName: "",
          isExternalSrc: true,
          created: { date: Math.floor(Date.now() / 1000) },
          updated: {
            date: Math.floor(Date.now() / 1000),
          },
        });

        asset.displayName = asset.getFileName();

        assets.push(asset);
      }
    }

    // iterate through the extra files directory
    const extraFilesDir = join(oldDir, "custom");
    if (existsSync(extraFilesDir)) {
      const extraFiles = await readdir(extraFilesDir);
      for (const file of extraFiles) {
        try {
          const oldPath = join(extraFilesDir, file);
          const newFilePath = join(newDir, file);

          // skip directories
          if (lstatSync(oldPath).isDirectory()) {
            continue;
          }

          // get the file creation date
          const stats = await lstat(oldPath);
          const date = Math.floor(stats.birthtimeMs / 1000);

          await rename(oldPath, newFilePath);

          const uuid = await createSimpleId("asset");
          const fullPath = `/${file}`;
          const isExternalSrc =
            fullPath.startsWith("http://") || fullPath.startsWith("https://");

          const asset = new AssetModel({
            uuid,
            projectId: projectId,
            path: fullPath,
            displayName: file,
            isExternalSrc,
            created: { date },
            updated: {
              date: Math.floor(Date.now() / 1000),
            },
            size: stats.size,
          });

          assets.push(asset);
        } catch (err) {
          console.log(err);
        }
      }
    }

    // save the editor data
    await pCollection.updateOne(
      {
        projectId: project.projectId,
      },
      {
        $set: {
          editorData,
        },
      }
    );

    if (assets.length > 0) {
      // insert the assets
      await assetCollection.insertMany(assets);
    }
  }
}

function updateAssetUrl(
  asset: AssetModel,
  editorData: ProjectModel["editorData"]
) {
  const currentUrl = `/assets/${asset.projectId}/${asset.displayName}`;
  const newUrl = asset.getUrl();

  if (currentUrl === newUrl) {
    return;
  }

  const recursiveUpdate = (obj: any) => {
    for (let key in obj) {
      if (typeof obj[key] === "object") {
        if (Array.isArray(obj[key])) {
          for (let i = 0; i < obj[key].length; i++) {
            if (typeof obj[key][i] === "object") {
              recursiveUpdate(obj[key][i]);
            }
          }
        } else {
          recursiveUpdate(obj[key]);
        }
      } else if (key === "src" || key === "id") {
        if (obj[key] === currentUrl) {
          obj[key] = newUrl;
        }
      }
    }
  };

  recursiveUpdate(editorData);
}
