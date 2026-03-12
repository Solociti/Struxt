import { ShowError } from "client/components/ShowError";
import { useMemo } from "react";
import Spinner from "react-bootstrap/Spinner";
import { useContentManager } from "../cm/contentManager";
import { createFileTree } from "../list/AssetList";
import { ItemContextMenu } from "../list/ContextMenu";
import { DirectoryView } from "../list/DirectoryView";
import { DeleteAssetsModal } from "../modals/DeleteAssetsModal";
import { DownloadAssetsModal } from "../modals/DownloadAssetsModal";
import { MoveAssetModal } from "../modals/MoveAssetModal";
import { NewAssetModal } from "../modals/NewAssetModal";
import { RenameAssetsModal } from "../modals/RenameAssetsModal";
import UploadAssetsModal from "../modals/UploadAssetsModal";

/**
 * Renders the project asset file tree and associated modals.
 */
export function AssetFileSection() {
  const { assets, commands } = useContentManager();
  const { list, loading, error } = assets;

  const fileTree = useMemo(() => {
    if (!list) {
      return null;
    }

    return createFileTree(list);
  }, [list]);

  return (
    <div className="p-3">
      <ShowError error={error} />

      {loading && <Spinner animation="border" size="sm" />}

      {fileTree && (
        <DirectoryView
          node={fileTree}
          level={0}
          onClick={(file) => {
            commands.trigger("tabs:open:file", file);
          }}
          onContextMenu={(file, target) => {
            commands.trigger("context-menu:show", target, file);
          }}
          showNewFileBtn={true}
          selected={[]}
        />
      )}

      <ItemContextMenu />

      <NewAssetModal />
      <DeleteAssetsModal />
      <RenameAssetsModal />
      <MoveAssetModal />
      <DownloadAssetsModal />
      <UploadAssetsModal />
    </div>
  );
}
