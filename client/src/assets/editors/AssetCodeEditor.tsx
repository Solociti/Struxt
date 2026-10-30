import { useLoadAsync } from "client/api/useLoadAsync";
import CodeEditor, {
  updateEditorModel,
} from "client/components/codeEditor/CodeEditor";
import { ShowError } from "client/components/ShowError";
import { useCallback } from "react";
import Spinner from "react-bootstrap/Spinner";
import { getTextAssetContents } from "../assetApis";
import { isFileTab, useContentManager } from "../cm/contentManager";

/**
 * Load the asset contents and setup the monaco editor
 *
 * @returns
 */
export default function AssetCodeEditor() {
  const { assets, tabs, project } = useContentManager();
  const { projectId } = project;

  // load the text content for the active tab
  const { response, isLoading, error } = useLoadAsync(async () => {
    if (!tabs.activeTab || !isFileTab(tabs.activeTab)) {
      return null;
    }

    const { item } = tabs.activeTab;
    const text = await getTextAssetContents(projectId, item);

    return {
      content: updateEditorModel(item.path, text),
      filePath: item.path,
    };
  }, [projectId, tabs.activeTab?.tabId || null]);

  const handleChange = useCallback(() => {
    if (!tabs.activeTab) {
      return;
    }

    tabs.markDirty(tabs.activeTab.tabId);
  }, [tabs.activeTab?.tabId || null]);

  const handleSave = useCallback(
    async (content: string) => {
      if (!tabs.activeTab || !isFileTab(tabs.activeTab)) {
        return;
      }

      return assets.saveTextAsset(tabs.activeTab.item.uuid, content);
    },
    [tabs.activeTab?.tabId || null],
  );

  if (tabs.activeTab && !isFileTab(tabs.activeTab)) {
    // This should never happen, but typescript and llm's like to complain, so here we are
    return (
      <div className="d-flex justify-content-center align-items-center h-100 p-2 gap-2">
        <div style={{ fontSize: "0.95rem" }}>No file selected</div>
      </div>
    );
  }

  const item = tabs.activeTab?.item;
  if (!item || isLoading || !response) {
    return (
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="d-flex justify-content-center align-items-center h-100 p-2 gap-2">
          <Spinner animation="border" />
          <div style={{ fontSize: "0.95rem" }}>
            {item ? `Loading ${item.displayName}` : "Loading Editor"}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <ShowError error={error} />
      </div>
    );
  }

  return (
    <CodeEditor {...response} onChange={handleChange} onSave={handleSave} />
  );
}
