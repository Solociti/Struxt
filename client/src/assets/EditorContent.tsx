import MaterialIcon from "client/components/MaterialIcon";
import { lazy, Suspense } from "react";
import Spinner from "react-bootstrap/Spinner";
import { getAssetUrl } from "./assetUtils";
import { useContentManager } from "./cm/contentManager";

const AssetCodeEditor = lazy(() => import("./editors/AssetCodeEditor"));

/**
 * Render the content for the editor
 *
 * @returns
 */
export function EditorContent() {
  const { project, tabs } = useContentManager();

  if (!tabs.activeTab) {
    return null;
  }
  const { activeTab } = tabs;
  const { item } = activeTab;

  if (item.isExternalSrc) {
    // use a iframe to render any external assets
    return (
      <div className="d-flex p-3 gap-2 flex-column h-100">
        <div className="d-flex p-2 align-items-center border rounded gap-1">
          <MaterialIcon>link</MaterialIcon>
          <a href={item.path} target="_blank" rel="noreferrer">
            {item.path}
          </a>
        </div>

        <iframe
          src={item.path}
          title={item.displayName}
          className="w-100 h-100"
        ></iframe>
      </div>
    );
  }

  if (tabs.activeTab.type === "text") {
    // show the text editor for text assets
    return (
      <Suspense
        fallback={
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div className="d-flex justify-content-center align-items-center h-100 p-2 gap-2">
              <Spinner animation="border" />
              <div style={{ fontSize: "0.95rem" }}>Loading Editor</div>
            </div>
          </div>
        }
      >
        <AssetCodeEditor />
      </Suspense>
    );
  }

  if (tabs.activeTab.type === "image") {
    // show the image for image assets
    // TODO: setup image editing tools
    return (
      <div className="d-flex justify-content-center align-items-center h-100 p-2">
        <img
          src={getAssetUrl(tabs.activeTab.item, project.projectId)}
          alt={item.displayName}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  if (tabs.activeTab.type === "video") {
    return (
      <div className="d-flex justify-content-center align-items-center h-100 p-2">
        <video
          src={getAssetUrl(tabs.activeTab.item, project.projectId)}
          controls
        ></video>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center h-100 flex-column text-muted">
      <MaterialIcon style={{ fontSize: "3rem" }}>
        insert_drive_file
      </MaterialIcon>
      <p className="mt-2">
        Preview not available for this file type ({activeTab.type}).
      </p>
    </div>
  );
}
