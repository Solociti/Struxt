import { getApi, postApi } from "client/api/api";
import {
  AssetApi,
  AssetCreateApi,
  AssetListFilesApi,
  AssetMoveApi,
  AssetRestoreApi,
  AssetSaveExternalApi,
} from "common/api/assets/assets";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { getAssetUrl } from "./assetUtils";
import { deStructureError } from "common/custom-error/custom-error";

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

async function errorWrapFetch(url: string, options?: RequestInit) {
  let responseCode: number = 0;

  try {
    const res = await fetch(url, options);
    responseCode = res.status;

    if (res.headers.get("Content-Type")?.includes("application/json")) {
      const data = await res.json();

      // check if the server sent an error
      if (data.error) {
        throw deStructureError(data.error, "API request failed.");
      }

      return data;
    } else {
      // if the response isn't json, just return the raw response
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      return res;
    }
  } catch (err) {
    if (err instanceof Error && !err.status) {
      err.status = responseCode;
    }

    throw err;
  }
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

  const response = await errorWrapFetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "text/plain",
    },
    body: content,
  });

  return response;
}

/**
 * Load the contents of a text asset
 *
 * @param projectId
 * @param asset
 * @returns
 */
export async function getTextAssetContents(
  projectId: string,
  asset: AssetModel | AssetListItem,
) {
  const url = getAssetUrl(asset, projectId);

  const response = await errorWrapFetch(url);
  if (response instanceof Response) {
    return response.text();
  }

  return response;
}

/**
 * Create new asset
 */
export async function createNewAsset(
  projectId: string,
  values: AssetCreateApi["PostBody"],
) {
  const response = await postApi<AssetCreateApi>(
    ["/api/assets/create", projectId],
    values,
  );
  return new AssetModel(response.asset);
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

/**
 * Restore the list of assets
 *
 * @param projectId
 * @param assets
 * @returns
 */
export async function restoreAsset(
  projectId: string,
  assets: AssetRestoreApi["PostBody"]["assets"],
) {
  const response = await postApi<AssetRestoreApi>(
    ["/api/assets/restore", projectId],
    {
      assets,
    },
  );

  return response;
}

/**
 * Move assets from one path to another
 *
 * @param projectId
 * @param assets
 * @param fromPath
 * @param toPath
 * @param onConflict
 * @returns
 */
export async function moveAssets(
  projectId: string,
  assets: { uuid: string }[],
  fromPath: string,
  toPath: string,
  onConflict: AssetMoveApi["PostBody"]["onConflict"],
  operation: "move" | "copy",
) {
  const response = await postApi<AssetMoveApi>(
    ["/api/assets/move", projectId],
    {
      assets,
      fromPath,
      toPath,
      onConflict,
      operation,
    },
  );

  return {
    ...response,
    completed: response.completed.map((asset) => new AssetModel(asset)),
    skipped: response.skipped.map((asset) => new AssetModel(asset)),
  };
}
