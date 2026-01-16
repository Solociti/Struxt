import { postApi } from "client/api/api";
import { AssetSaveExternalApi } from "common/api/assets/assets";

/**
 * Save an external asset to the project
 *
 * @param projectId
 * @param assetSrc
 * @returns
 */
export async function saveExternalAsset(projectId: string, assetSrc: string) {
  const response = await postApi<AssetSaveExternalApi>(
    ["/api/assets/save-external-asset", projectId],
    {
      assetSrc,
    }
  );

  return response.asset;
}
