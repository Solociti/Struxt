import { ShowError } from "client/components/ShowError";
import { AssetListItem } from "common/models/assets/AssetModel";
import { useMemo } from "react";
import Spinner from "react-bootstrap/Spinner";
import { useContentManager } from "../cm/contentManager";
import { DeleteAssetsModal } from "../modals/DeleteAssetsModal";
import { MoveAssetModal } from "../modals/MoveAssetModal";
import { NewAssetModal } from "../modals/NewAssetModal";
import { RenameAssetsModal } from "../modals/RenameAssetsModal";
import { ItemContextMenu } from "./ContextMenu";
import { DirectoryNode, DirectoryView } from "./DirectoryView";

/**
 * Create the directory tree to use when rendering the file list
 *
 * @param list
 * @returns
 */
export function createFileTree(list: AssetListItem[]): DirectoryNode {
  const root: DirectoryNode = {
    name: "root",
    path: "/",
    subDirectories: {
      public: {
        files: [],
        subDirectories: {},
        name: "public",
        path: "/public/",
        defaultOpen: true,
      },
      routines: {
        files: [],
        subDirectories: {},
        name: "routines",
        path: "/routines/",
        defaultOpen: false,
      },
    },
    files: [],
  };

  for (const item of list) {
    if (item.isExternalSrc) {
      if (!root.subDirectories.external) {
        root.subDirectories.external = {
          name: "external",
          path: "/external/",
          isExternalSrc: true,
          preventNewFile: true,
          subDirectories: {},
          files: [],
        };
      }

      root.subDirectories.external.files.push(item);
      continue;
    }

    const parts = item.path.split("/").filter(Boolean);
    // remove the last part, which is the filename
    parts.pop();

    let current = root;

    for (const part of parts) {
      if (!current.subDirectories[part]) {
        current.subDirectories[part] = {
          name: part,
          path: `${current.path}${part}/`,
          subDirectories: {},
          files: [],
        };
      }
      current = current.subDirectories[part];
    }

    current.files.push(item);
  }

  if (root.subDirectories[".trash"]) {
    root.subDirectories[".trash"].preventNewFile = true;
  }

  return root;
}

/**
 * Get all the items in a directory and its sub-directories
 *
 * @param dir
 * @returns
 */
export function getRecursiveDirItems(dir: DirectoryNode): AssetListItem[] {
  const items: AssetListItem[] = [];

  for (const subDir of Object.values(dir.subDirectories)) {
    items.push(...getRecursiveDirItems(subDir));
  }

  items.push(...dir.files);

  return items;
}

export function AssetList() {
  const { assets, commands } = useContentManager();
  const { list, loading, error } = assets;

  const fileTree = useMemo(() => {
    if (!list) {
      return null;
    }

    return createFileTree(list);
  }, [list]);

  return (
    <div
      style={{ width: "200px", overflowY: "auto" }}
      className="h-100 border-end p-3"
    >
      <ShowError error={error} />

      {loading && <Spinner animation="border" size="sm" />}

      <div>
        {fileTree && (
          <DirectoryView
            node={fileTree}
            level={0}
            onClick={(file) => {
              commands.trigger("tabs:open", file);
            }}
            onContextMenu={(file, target) => {
              commands.trigger("context-menu:show", target, file);
            }}
            showNewFileBtn={true}
            selected={[]}
          />
        )}

        <ItemContextMenu />
      </div>

      <NewAssetModal />
      <DeleteAssetsModal />
      <RenameAssetsModal />
      <MoveAssetModal />
    </div>
  );
}
