import {
  AssetApi,
  AssetCreateApi,
  AssetDeleteApi,
  AssetListFilesApi,
  AssetSaveExternalApi,
} from "common/api/assets/assets";
import { customError } from "common/custom-error/custom-error";
import { AssetModel } from "common/models/assets/AssetModel";
import { roles } from "common/models/user/Roles";
import { dirname, join, normalize } from "node:path";
import { isPathInside } from "server/hfs/path";
import { hfsWriteFile } from "server/hfs/writeFile";
import { createSimpleId } from "server/utils/createId";
import { mkDirRecursive } from "server/utils/mkDir";
import { getProjectFilesDir } from "server/utils/uploadDir";
import z from "zod";
import { registerApi } from "../registerApi";
import { isAssetPathUnique } from "./assetPathOps";
import { deleteAsset } from "./deleteAsset";
import { getAsset, getAssetList } from "./getAssets";
import { saveAsset } from "./saveAsset";

registerApi<AssetApi>("/api/assets/model/:projectId").get(
  [roles.struxt.editor],
  async ({ user, params, query }) => {
    const { projectId } = z
      .object({
        projectId: z.string(),
      })
      .parse(params);

    const { uuid } = z
      .object({
        uuid: z.string(),
      })
      .parse(query);

    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to view this project.",
      );
    }

    const asset = await getAsset(uuid, projectId);
    if (!asset) {
      throw customError(404, "Asset not found.");
    }

    return {
      asset,
    };
  },
);

registerApi<AssetCreateApi>("/api/assets/create/:projectId").post(
  [roles.struxt.editor],
  async ({ body, user, params }) => {
    const { projectId } = z
      .object({
        projectId: z.string(),
      })
      .parse(params);

    const parsedBody = z
      .object({
        path: z.string(),
      })
      .parse(body);

    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
        "Forbidden",
      );
    }

    const path = normalize(parsedBody.path);
    const uuid = await createSimpleId("asset");

    // verify that the path is unique
    if (!(await isAssetPathUnique(projectId, uuid, path))) {
      throw customError(400, "Asset path is not unique.");
    }

    const asset = new AssetModel({
      uuid,
      projectId,
      path: path,
      isExternalSrc: false,
      size: 0,
      created: {
        date: Math.floor(Date.now() / 1000),
        userId: user.id,
        displayName: user.name,
      },
      updated: {
        date: Math.floor(Date.now() / 1000),
        userId: user.id,
        displayName: user.name,
      },
    });
    asset.displayName = asset.getFileName();

    // create a empty file on disk
    const projectFilesDir = getProjectFilesDir(projectId);
    const filePath = join(projectFilesDir, asset.path);
    if (!isPathInside(filePath, projectFilesDir)) {
      throw customError(400, "Invalid file path.");
    }

    const dir = dirname(filePath);

    await mkDirRecursive(dir);
    await hfsWriteFile(filePath, "", {
      restrictedTo: projectFilesDir,
    });

    await saveAsset(asset);

    return {
      success: true,
      asset,
    };
  },
);

registerApi<AssetSaveExternalApi>(
  "/api/assets/save-external-asset/:projectId",
).post([roles.struxt.editor], async ({ body, user, params }) => {
  const { projectId } = z
    .object({
      projectId: z.string(),
    })
    .parse(params);

  const { assetSrc } = z
    .object({
      assetSrc: z.string().startsWith("https://"),
    })
    .parse(body);

  // check if the user has permission to edit the project
  if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
    throw customError(
      403,
      "You do not have permission to modify this project.",
    );
  }

  const uuid = await createSimpleId("asset");
  const asset = new AssetModel({
    uuid,
    projectId,
    path: assetSrc,
    displayName: AssetModel.getFileName(assetSrc),
    isExternalSrc: true,
    size: 0,
    created: {
      date: Math.floor(Date.now() / 1000),
      userId: user.id,
      displayName: user.name,
    },
    updated: {
      date: Math.floor(Date.now() / 1000),
      userId: user.id,
      displayName: user.name,
    },
  });
  const success = await saveAsset(asset);

  if (!success) {
    throw customError(500, "Failed to save asset.");
  }

  return {
    success,
    asset: asset.getEditorAsset(),
  };
});

registerApi<AssetDeleteApi>("/api/assets/delete/:projectId").post(
  [roles.struxt.editor],
  async ({ params, user, body }) => {
    const { projectId } = z
      .object({
        projectId: z.string(),
      })
      .parse(params);

    // check if the user has permission to edit the project
    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to modify this project.",
      );
    }

    // parse the body
    const { assets } = z
      .object({
        assets: z.array(
          z.object({
            uuid: z.string(),
          }),
        ),
      })
      .parse(body);

    for (const asset of assets) {
      await deleteAsset(asset.uuid, projectId, {
        userId: user.id,
        displayName: user.name,
      });
    }

    return {
      success: true,
    };
  },
);

registerApi<AssetListFilesApi>("/api/assets/list-files/:projectId").get(
  [roles.struxt.editor],
  async ({ user, params }) => {
    const { projectId } = z
      .object({
        projectId: z.string(),
      })
      .parse(params);

    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to view this project.",
      );
    }

    const files = await getAssetList(projectId);

    return {
      files,
    };
  },
);
