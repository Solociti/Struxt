import { AssetApi, AssetDeleteApi } from "common/api/assets/assets";
import { postApi } from "../api/api";

/**
 * Upload the given files as assets to the project
 *
 * @param projectId
 * @param files
 * @returns
 */
export async function uploadAssets(projectId: string, files: File[]) {
  const body = new FormData();
  for (const file of files) {
    body.append("files", file);
  }

  const response = await postApi<AssetApi>(
    ["/api/assets/upload", projectId],
    body
  );

  return response;
}

/**
 * Request assets to be deleted from the project
 *
 * @param projectId
 * @param assets
 * @returns
 */
export async function deleteAssets(
  projectId: string,
  assets: AssetDeleteApi["PostBody"]["assets"]
) {
  const response = await postApi<AssetDeleteApi>(
    ["/api/assets/delete", projectId],
    {
      assets,
    }
  );

  return response;
}
