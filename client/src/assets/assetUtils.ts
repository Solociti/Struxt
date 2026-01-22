import { AssetModel } from "common/models/assets/AssetModel";

/**
 * Get the fully qualified URL for an asset.
 * This constructs a URL that matches the server's asset serving logic.
 *
 * @param asset The asset to get the URL for
 * @param projectId The ID of the project the asset belongs to
 */
export function getAssetUrl(asset: AssetModel, projectId: string): string {
  if (asset.isExternalSrc) {
    return asset.path;
  }

  // Local assets are served via the assetFilesRouter at /assets/:projectId/*
  // The server expects: /assets/{projectId}/public{AssetModel.path}
  // But wait, the AssetModel.path e.g. "/assets/test.js" might already include some path.
  // The original upload logic joined `getAssetDir(projectId)` with filename.
  // `getAssetDir` is normally `.../projectId/assets`.
  // So `path` in DB is `/assets/filename.ext` relative to project?
  // Let's check `register.ts`:
  // newFilePath = join(getAssetDir(projectId), newFileName);
  // asset.path = `/assets/${newFileName}`;
  //
  // And the router:
  // assetFilesRouter.get("/:projectId/*filePath", ...)
  // requestedFile = normalize(join(projectFilesDir, ...pathParts));
  //
  // If we request /assets/PROJ/assets/file.js
  // req.params.filePath = "assets/file.js"
  // projectFilesDir = .../PROJ
  // requestedFile = .../PROJ/assets/file.js
  //
  // So the URL should be `/assets/${projectId}${asset.path}`.
  // Not "public". The previous user note about "public" might have been a guess or referring to a specific folder.
  // Based on `register.ts` in context:
  // router is mounted at `/assets` (in apiEntry.ts: app.use("/assets", assetFilesRouter); )
  // Route is `/:projectId/*filePath`
  // Asset path is `/assets/logo.png`
  // So `/assets/PROJ/assets/logo.png` seems correct.

  return `/assets/${projectId}${asset.path}`;
}
