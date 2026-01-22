import { useLoadAsync } from "client/api/useLoadAsync";
import { ShowError } from "client/components/ShowError";
import { AssetListItem } from "common/models/assets/AssetModel";
import { useMemo } from "react";
import Spinner from "react-bootstrap/Spinner";
import { DirectoryNode, DirectoryView } from "./DirectoryView";
import { getAssetList } from "../assetApis";

interface AssetListProps {
  projectId: string;
  handleEdit: (item: AssetListItem) => void;
}

export function AssetList({ projectId, handleEdit }: AssetListProps) {
  // load the list of assets
  const {
    response: assetList,
    isLoading: loadingList,
    error: listError,
  } = useLoadAsync(async () => {
    if (projectId === "*") {
      return null;
    }

    return await getAssetList(projectId);
  }, [projectId]);

  const fileTree = useMemo(() => {
    if (!assetList) return null;
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
        assets: {
          files: [],
          subDirectories: {},
          name: "assets",
          path: "/assets/",
          defaultOpen: true,
        },
      },
      files: [],
    };

    for (const item of assetList) {
      // item.path is typically /assets/filename.png or /assets/folder/file.js
      // We want to tree-ify it.
      // Remove leading slash
      const cleanPath = item.path.startsWith("/")
        ? item.path.substring(1)
        : item.path;
      const parts = cleanPath.split("/").filter((p: string) => p);
      // Last part is filename (displayName usually matches or similar)
      const fileName = parts.pop();

      let current = root;
      // Navigate folders
      for (const part of parts) {
        if (!current.subDirectories[part]) {
          current.subDirectories[part] = {
            name: part,
            path: current.path + part + "/",
            subDirectories: {},
            files: [],
          };
        }
        current = current.subDirectories[part];
      }
      // Add file
      if (fileName) {
        // Should always be true
        current.files.push(item);
      }
    }

    return root;
  }, [assetList]);

  return (
    <div
      style={{ width: "200px", overflowY: "auto" }}
      className="h-100 border-end p-3"
    >
      <style>
        {`          
          .dir-hover-guide {
            background-color: transparent;
            transition: background-color 0.1s;
            margin-top: 5px;
            margin-bottom: 5px;
            margin-left: -5px;
          }
          .dir-section:hover > .dir-children-container > .dir-hover-guide {
            background-color: rgba(103, 103, 103, 0.5);
          }
          
          .dir-item > .modify-dir-btns {
            opacity: 0;
            transition: opacity 0.1s;
          }
          .dir-item:hover > .modify-dir-btns {
            opacity: 1;
          }
          .file-item:hover, .dir-item:hover {
            background-color: rgba(103, 103, 103, 0.1);
          }
        `}
      </style>
      <ShowError error={listError} />

      {loadingList && <Spinner animation="border" size="sm" />}

      <div>
        {fileTree && (
          <DirectoryView node={fileTree} level={0} handleEdit={handleEdit} />
        )}
      </div>
    </div>
  );
}
