import { useLoadAsync } from "client/api/useLoadAsync";
import CodeEditor from "client/components/codeEditor/CodeEditor";
import ErrorBoundary from "client/components/ErrorBoundary";
import MaterialIcon from "client/components/MaterialIcon";
import { ShowError } from "client/components/ShowError";
import { useCurrentProject } from "client/projects/ProjectContext";
import { centerTruncateText } from "common/format/text";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { getFileType, isTextFile } from "common/models/assets/FileExtensions";
import { Suspense, useState } from "react";
import Nav from "react-bootstrap/Nav";
import Spinner from "react-bootstrap/Spinner";
import { getAsset, saveAssetContent } from "./assetApis";
import { getAssetUrl } from "./assetUtils";
import { AssetList } from "./list/AssetList";
import { FileIcon } from "./list/FileIcon";

/**
 * Show the assets lists and editor
 *
 * @returns
 */
export default function AssetsPage() {
  const { project } = useCurrentProject();

  /**
   * The list of assets that are open in the editor
   */
  const [openAssets, setOpenAssets] = useState<AssetListItem[]>([]);

  const [selectedAsset, setSelectedAsset] = useState<AssetListItem | null>(
    null,
  );

  // load the current selected asset metadata and content
  const [editAsset, setEditAsset] = useState<AssetModel | null>(null);
  const [editContent, setEditContent] = useState<string>("");

  const { isLoading: loadingAsset, error: assetError } =
    useLoadAsync(async () => {
      if (project.projectId === "*" || !selectedAsset) {
        setEditAsset(null);
        setEditContent("");
        return null;
      }

      const asset = await getAsset(project.projectId, selectedAsset.uuid);

      if (asset.isExternalSrc) {
        setEditContent("");
      } else {
        if (asset.isTextFile()) {
          const url = getAssetUrl(asset, project.projectId);
          const res = await fetch(url);

          if (!res.ok) {
            throw new Error("Failed to fetch asset content");
          }
          const text = await res.text();
          setEditContent(text);
        } else {
          setEditContent("");
        }
      }
      setEditAsset(asset);

      return null;
    }, [project.projectId, selectedAsset]);

  // don't show anything if the project is not selected
  if (project.projectId === "*") {
    return (
      <div className="p-3">
        <h1 className="fw-bold">Assets</h1>
        <p className="text-muted">Please select a project to continue.</p>
      </div>
    );
  }

  /**
   * Handle when a file is opened in the editor.
   *
   * @param file
   * @returns
   */
  const handleOpenAsset = (file: AssetListItem) => {
    setSelectedAsset(file);

    // add the file to the open assets list if it's not already there
    const index = openAssets.findIndex((f) => f.uuid === file.uuid);
    if (index >= 0) {
      if (openAssets[index] !== file) {
        setOpenAssets((open) => [
          ...open.filter((f) => f.uuid !== file.uuid),
          file,
        ]);
      }

      return;
    }
    setOpenAssets((open) => [...open, file]);
  };

  /**
   * Handle when a file is closed in the editor.
   *
   * @param file
   */
  const handleCloseAsset = (file: AssetListItem) => {
    setOpenAssets((open) => {
      // get the current index as a starting point
      const currentIndex = open.findIndex((f) => f.uuid === file.uuid);

      // remove the file from the list
      const list = open.filter((f) => f.uuid !== file.uuid);
      const newIndex = Math.max(Math.min(currentIndex - 1, list.length - 1), 0);

      if (list[newIndex]) {
        setSelectedAsset(list[newIndex]);
      } else {
        setSelectedAsset(null);
      }

      return list;
    });
  };

  const handleSave = async (content: string) => {
    if (!editAsset) return;
    await saveAssetContent(project.projectId, editAsset.uuid, content);
  };

  return (
    <div className="d-flex h-100" style={{ overflowY: "hidden" }}>
      <ErrorBoundary>
        {/* show a sidebar with the list of files */}
        <AssetList projectId={project.projectId} handleEdit={handleOpenAsset} />

        {/* Show the code editor */}
        <div
          className="d-flex flex-column h-100 flex-grow-1"
          style={{ overflow: "hidden", minWidth: 0 }}
        >
          <ErrorBoundary>
            <Nav
              variant="tabs"
              className="px-1 flex-shrink-0"
              activeKey={selectedAsset?.uuid || ""}
              onSelect={(uuid) => {
                const file = openAssets.find((f) => f.uuid === uuid);
                if (file) {
                  handleOpenAsset(file);
                }
              }}
            >
              {openAssets.map((asset) => {
                const isActive = selectedAsset?.uuid === asset.uuid;
                const extension = new AssetModel({
                  displayName: asset.displayName,
                  path: asset.path,
                }).getFileExtension();

                return (
                  <Nav.Item key={asset.uuid}>
                    <Nav.Link
                      eventKey={asset.uuid}
                      className="d-flex px-2 align-items-center cursor-pointer"
                      as="div"
                      title={asset.displayName}
                    >
                      <FileIcon extension={extension} />
                      {centerTruncateText(asset.displayName, 15)}
                      {isActive && (
                        <MaterialIcon
                          style={{ fontSize: "1.15em" }}
                          className="ms-1 cursor-pointer"
                          onClick={() => handleCloseAsset(asset)}
                        >
                          close
                        </MaterialIcon>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>

            {/* show the editor for the selected asset */}
            {assetError && (
              <div className="p-5">
                <ShowError error={assetError} />
              </div>
            )}

            {!editAsset && !loadingAsset && (
              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-muted">
                <MaterialIcon style={{ fontSize: "4rem" }}>code</MaterialIcon>
                <p className="mt-3">Select an asset to start editing</p>
              </div>
            )}

            {!editAsset && loadingAsset && (
              <div className="d-flex align-items-center justify-content-center flex-grow-1 text-muted">
                <Spinner variant="border" />
                <span className="ms-2">Loading asset...</span>
              </div>
            )}

            {editAsset && (
              <Suspense
                fallback={
                  <div className="text-muted p-5 text-center">
                    <Spinner variant="border" />
                    <div>Loading Editor</div>
                  </div>
                }
              >
                <div
                  className="flex-grow-1"
                  style={{
                    minHeight: 0,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Render based on type */}
                  {(() => {
                    const ext = editAsset.getFileExtension();

                    if (isTextFile(ext) && !editAsset.isExternalSrc) {
                      return (
                        <CodeEditor
                          content={editContent}
                          filePath={editAsset.path}
                          onSave={handleSave}
                        />
                      );
                    } else if (getFileType(ext) === "image") {
                      return (
                        <div className="d-flex flex-column h-100 p-2">
                          {editAsset.isExternalSrc ? (
                            <div className="d-flex p-2 align-items-center border rounded gap-1">
                              <MaterialIcon>link</MaterialIcon>
                              <a
                                href={editAsset.path}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {editAsset.path}
                              </a>
                            </div>
                          ) : null}
                          <div className="d-flex justify-content-center align-items-center h-100">
                            <img
                              src={getAssetUrl(editAsset, project.projectId)}
                              alt={editAsset.displayName}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                          </div>
                        </div>
                      );
                    } else if (editAsset.isExternalSrc) {
                      return (
                        <div className="d-flex justify-content-center align-items-center h-100 flex-column">
                          <MaterialIcon style={{ fontSize: "3rem" }}>
                            link
                          </MaterialIcon>
                          <h4 className="mt-2">External Asset</h4>
                          <p>
                            <a
                              href={editAsset.path}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {editAsset.path}
                            </a>
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="d-flex justify-content-center align-items-center h-100 flex-column text-muted">
                          <MaterialIcon style={{ fontSize: "3rem" }}>
                            insert_drive_file
                          </MaterialIcon>
                          <p className="mt-2">
                            Preview not available for this file type.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </Suspense>
            )}
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
}
