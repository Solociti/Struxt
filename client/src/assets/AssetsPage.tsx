import ErrorBoundary from "client/components/ErrorBoundary";
import MaterialIcon from "client/components/MaterialIcon";
import { ShowError } from "client/components/ShowError";
import { Suspense } from "react";
import Spinner from "react-bootstrap/Spinner";
import { ContentManagerProvider, useContentManager } from "./cm/contentManager";
import { EditorContent } from "./EditorContent";
import { EditorTabs } from "./EditorTabs";
import { AssetList } from "./list/AssetList";

/**
 * Show the assets lists and editor
 *
 * @returns
 */
function AssetsPageContent() {
  const { isSingleProject, tabs } = useContentManager();

  // don't show anything if the project is not selected
  if (!isSingleProject) {
    return (
      <div className="p-3">
        <h1 className="fw-bold">Assets</h1>
        <p className="text-muted">Please select a project to continue.</p>
      </div>
    );
  }

  const content = (() => {
    if (!tabs.activeTab) {
      // show a default page prompting the user to select an asset
      return (
        <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-muted">
          <MaterialIcon style={{ fontSize: "4rem" }}>code</MaterialIcon>
          <p className="mt-3">Select an asset to start editing</p>
        </div>
      );
    } else if (tabs.activeTab.assetLoadError) {
      // show the error if the asset failed to load
      return (
        <div className="p-5">
          <ShowError error={tabs.activeTab.assetLoadError} />
        </div>
      );
    } else if (tabs.activeTab.isAssetLoading) {
      // show a loading indicator if the asset is still loading
      return (
        <div className="d-flex align-items-center justify-content-center flex-grow-1 text-muted">
          <Spinner variant="border" />
          <span className="ms-2">Loading asset...</span>
        </div>
      );
    }

    // if the asset is loaded, render the editor
    return (
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
          <EditorContent />
        </div>
      </Suspense>
    );
  })();

  return (
    <div className="d-flex h-100" style={{ overflowY: "hidden" }}>
      <ErrorBoundary>
        {/* show a sidebar with the list of files */}
        <AssetList />

        {/* Show the code editor */}
        <div
          className="d-flex flex-column h-100 flex-grow-1"
          style={{ overflow: "hidden", minWidth: 0 }}
        >
          <ErrorBoundary>
            <EditorTabs />

            {content}
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <ContentManagerProvider>
      <AssetsPageContent />
    </ContentManagerProvider>
  );
}
