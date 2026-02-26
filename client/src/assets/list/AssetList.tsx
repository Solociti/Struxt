import { ShowError } from "client/components/ShowError";
import { AssetListItem } from "common/models/assets/AssetModel";
import { useCallback, useMemo, useRef, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { useContentManager } from "../cm/contentManager";
import { DeleteAssetsModal } from "../modals/DeleteAssetsModal";
import { DownloadAssetsModal } from "../modals/DownloadAssetsModal";
import { MoveAssetModal } from "../modals/MoveAssetModal";
import { NewAssetModal } from "../modals/NewAssetModal";
import { RenameAssetsModal } from "../modals/RenameAssetsModal";
import UploadAssetsModal from "../modals/UploadAssetsModal";
import { ItemContextMenu } from "./ContextMenu";
import { DirectoryNode, DirectoryView } from "./DirectoryView";

const defaultTreeWidth = 250;
const storageKey = "asset-tree-width";

let storeTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounces writing the sidebar width to localStorage.
 */
function setStoredWidth(width: number) {
  if (storeTimeoutId) {
    clearTimeout(storeTimeoutId);
  }
  storeTimeoutId = setTimeout(() => {
    localStorage.setItem(storageKey, String(width));
    storeTimeoutId = null;
  }, 500);
}

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

/**
 * Renders the resizable asset file tree panel.
 */
export function AssetList() {
  const { assets, commands } = useContentManager();
  const { list, loading, error } = assets;

  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored) : defaultTreeWidth;
  });

  const updateWidth = useCallback((newWidth: number) => {
    setWidth(newWidth);
    setStoredWidth(newWidth);
  }, []);

  const [isDragging, setIsDragging] = useState(false);

  const widthRef = useRef(width);
  widthRef.current = width;
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const isDraggingRef = useRef(false);

  const fileTree = useMemo(() => {
    if (!list) {
      return null;
    }

    return createFileTree(list);
  }, [list]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: widthRef.current };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current) {
        return;
      }
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }
      const newWidth =
        dragRef.current.startWidth + (e.clientX - dragRef.current.startX);

      const maxWidth = Math.max(
        window.innerWidth * 0.25,
        defaultTreeWidth * 1.5,
      );
      updateWidth(Math.max(100, Math.min(newWidth, maxWidth)));
    },
    [updateWidth],
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  return (
    <>
      {isDragging && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            cursor: "col-resize",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}

      <div
        style={{ width, minWidth: width, position: "relative", flexShrink: 0 }}
        className="h-100 border-end"
      >
        <div style={{ overflowY: "auto", height: "100%" }} className="p-3">
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

          <DownloadAssetsModal />
          <UploadAssetsModal />
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 5,
            height: "100%",
            cursor: "col-resize",
            backgroundColor: isDragging
              ? "rgba(73, 80, 87, 0.4)"
              : "transparent",
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={() => updateWidth(defaultTreeWidth)}
        />
      </div>
    </>
  );
}
