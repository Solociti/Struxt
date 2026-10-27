import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";

/**
 * Get the fully qualified URL for an asset.
 * This constructs a URL that matches the server's asset serving logic.
 *
 * @param asset The asset to get the URL for
 * @param projectId The ID of the project the asset belongs to
 */
export function getAssetUrl(
  asset: AssetModel | AssetListItem,
  projectId: string,
): string {
  if (asset.isExternalSrc) {
    return asset.path;
  }

  return `/assets/${projectId}${asset.path}`;
}
