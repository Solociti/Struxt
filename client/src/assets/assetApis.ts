import { getApi, postApi } from "client/api/api";
import { AssetModel } from "common/models/assets/AssetModel";
import {
  AssetApi,
  AssetListFilesApi,
  AssetCreateApi,
  AssetSaveExternalApi,
} from "common/api/assets/assets";

/**
 * Get the asset metadata for the provided project and uuid.
 *
 * @param projectId
 * @param uuid
 * @returns
 */
export async function getAsset(projectId: string, uuid: string) {
  const response = await getApi<AssetApi>(["/api/assets/model", projectId], {
    uuid,
  });

  return new AssetModel(response.asset);
}

/**
 * Get the list of assets for the provided project.
 *
 * @param projectId
 * @returns
 */
export async function getAssetList(projectId: string) {
  const response = await getApi<AssetListFilesApi>([
    "/api/assets/list-files",
    projectId,
  ]);

  return response.files;
}

/**
 * Save asset content (text)
 *
 * TODO: This should be modified to allow for binary assets as well.
 */
export async function saveAssetContent(
  projectId: string,
  uuid: string,
  content: string,
) {
  const url = `/assets/${projectId}/${uuid}`;

  await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "text/plain",
    },
    body: content,
  });
}

/**
 * Create new asset
 */
export async function createNewAsset(
  projectId: string,
  values: { displayName: string; path: string },
) {
  const response = await postApi<AssetCreateApi>(
    ["/api/assets/create", projectId],
    values,
  );
  return response.asset;
}

export async function saveExternalAsset(projectId: string, assetSrc: string) {
  const response = await postApi<AssetSaveExternalApi>(
    ["/api/assets/save-external-asset", projectId],
    {
      assetSrc,
    },
  );

  return response.asset;
}
