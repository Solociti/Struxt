import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { AssetListItem } from "common/models/assets/AssetModel";
import { basename, join } from "common/path/path";
import { validateMoveLocation } from "common/path/validateMoveLocation";
import { useEffect, useMemo, useState } from "react";
import { moveAssets } from "../assetApis";
import { useContentManager } from "../cm/contentManager";
import { createFileTree } from "../list/AssetList";
import { DirectoryItem } from "../list/DirectoryItem";
import { DirectoryNode } from "../list/DirectoryView";

export function MoveAssetModal() {
  const { commands, isSingleProject, assets, project } = useContentManager();

  const [show, setShow] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<AssetListItem[]>([]);
  const [fromPath, setFromPath] = useState<string>("");
  const [toPath, setToPath] = useState<string>("");

  const { isValid, warningMessage } = useMemo(() => {
    const res = validateMoveLocation(fromPath, toPath);
    if (res.isValid) {
      const isDir = fromPath.endsWith("/");
      const newPath = join(toPath, basename(fromPath)) + (isDir ? "/" : "");
      return validateMoveLocation(fromPath, newPath);
    }
    return res;
  }, [toPath, fromPath]);

  useEffect(() => {
    const unregisterShow = commands.on("move:show", (items, path) => {
      setSelectedAssets(items);
      setFromPath(path);
      setToPath("");
      setShow(true);
    });
    const unregisterHide = commands.on("move:hide", () => {
      setSelectedAssets([]);
      setFromPath("");
      setToPath("");
      setShow(false);
    });

    return () => {
      unregisterShow();
      unregisterHide();
    };
  }, [commands]);

  const fileTree = useMemo(() => {
    if (!assets.list) {
      return null;
    }

    const tree = createFileTree(assets.list);

    // remove any dirs where file can't be added
    function filterDirs(node: DirectoryNode): DirectoryNode | null {
      if (node.preventNewFile) {
        return null;
      }

      const subDirectories: Record<string, DirectoryNode> = {};

      for (let key in node.subDirectories) {
        const subDir = node.subDirectories[key];
        if (subDir.preventNewFile) {
          continue;
        }

        const filteredSubDir = filterDirs(subDir);
        if (filteredSubDir) {
          subDirectories[key] = filteredSubDir;

          // also remove all files
          filteredSubDir.files = [];
        }
      }

      return {
        ...node,
        subDirectories,
      };
    }

    return filterDirs(tree);
  }, [assets.list]);

  const handleHide = () => {
    commands.trigger("move:hide");
  };

  const moveCb = useAsyncCallback(
    async () => {
      const isDir = fromPath.endsWith("/");
      const newPath = join(toPath, basename(fromPath)) + (isDir ? "/" : "");

      const result = await moveAssets(
        project.projectId,
        selectedAssets,
        fromPath,
        newPath,
        "throw",
      );

      commands.trigger("move", result);
      if (result.completed.length > 0) {
        handleHide();
      }
    },
    {
      toastError: true,
    },
  );

  if (!isSingleProject) {
    return null;
  }

  return (
    <SimpleModal
      title="Move Asset"
      show={show}
      onHide={handleHide}
      footer={
        <>
          <IconButton variant="secondary" icon="close" onClick={handleHide}>
            Close
          </IconButton>
          <IconButton
            variant="primary"
            icon="move_item"
            disabled={!isValid || moveCb.isLoading}
            spinner={moveCb.isLoading}
            onClick={moveCb.callback}
          >
            Move
          </IconButton>
        </>
      }
    >
      <div>
        <div>
          Moving {selectedAssets.length} asset(s)
          {toPath ? (
            <>
              <span> to </span>
              <span className="text-muted">{toPath}</span>
            </>
          ) : (
            ""
          )}
        </div>

        {warningMessage && (
          <div
            className="border border-warning rounded p-2 my-2 text-warning"
            style={{ backgroundColor: "rgba(97, 97, 97, 0.1)" }}
            role="alert"
          >
            <small>{warningMessage}</small>
          </div>
        )}

        <hr />

        {/* show the list of directories to potentially move into */}
        <div>
          {fileTree && (
            <DirectoryItem
              dir={fileTree}
              level={0}
              defaultOpen
              onClick={() => {}}
              onDirClick={(dir) => setToPath(dir.path)}
              onContextMenu={() => {}}
              showNewFileBtn={false}
              selected={[toPath]}
            />
          )}
        </div>
      </div>
    </SimpleModal>
  );
}
