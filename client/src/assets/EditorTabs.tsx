import MaterialIcon from "client/components/MaterialIcon";
import { centerTruncateText } from "common/format/text";
import { AssetModel } from "common/models/assets/AssetModel";
import { getFileExtension } from "common/path/FileExtensions";
import Nav from "react-bootstrap/Nav";
import {
  FileTab as FileTabInterface,
  isFileTab,
  useContentManager,
} from "./cm/contentManager";
import { FileIcon } from "./list/FileIcon";

import "./editor-tabs.scss";

/**
 * Setup the tabs for the editor
 *
 * @returns
 */
export function EditorTabs() {
  const { tabs } = useContentManager();
  const { list, activeTab } = tabs;

  return (
    <Nav
      variant="tabs"
      className="px-1 flex-shrink-0"
      activeKey={activeTab?.tabId || ""}
      onSelect={(uuid) => {
        if (uuid) {
          tabs.setActiveTab(uuid);
        }
      }}
    >
      {list.map((tab) => {
        const { isDirty } = tab;

        return (
          <Nav.Item key={tab.tabId}>
            {isFileTab(tab) ? (
              <FileTab tab={tab} />
            ) : (
              <Nav.Link
                eventKey={tab.tabId}
                className={`d-flex px-2 align-items-center cursor-pointer editor-tab-item ${
                  isDirty ? "dirty" : ""
                }`}
                as="div"
                title={tab.type}
              >
                <MaterialIcon style={{ fontSize: "1rem" }} className="pe-1">
                  alt_route
                </MaterialIcon>
                {centerTruncateText(tab.name, 15)}

                <CloseIcon isDirty={isDirty} tabId={tab.tabId} />
              </Nav.Link>
            )}
          </Nav.Item>
        );
      })}
    </Nav>
  );
}

/**
 * Render a file tab in the editor tab bar
 *
 * @param param0
 */
function FileTab({ tab }: { tab: FileTabInterface }) {
  const { item, isDirty } = tab;

  const fileName = AssetModel.getFileName(item.path);
  const extension = getFileExtension(fileName);

  return (
    <Nav.Link
      eventKey={item.uuid}
      className={`d-flex px-2 align-items-center cursor-pointer editor-tab-item ${
        isDirty ? "dirty" : ""
      }`}
      as="div"
      title={item.displayName}
    >
      <FileIcon extension={extension} />
      {centerTruncateText(item.displayName, 15)}

      <CloseIcon isDirty={isDirty} tabId={tab.tabId} />
    </Nav.Link>
  );
}

/**
 * Render the close icon for a tab.
 *
 * @param param0
 * @returns
 */
function CloseIcon({ isDirty, tabId }: { isDirty: boolean; tabId: string }) {
  const { tabs } = useContentManager();

  return (
    <div
      className="d-flex justify-content-center cursor-pointer ms-1 editor-tab-status-wrapper"
      title={isDirty ? "Unsaved Changes" : ""}
      onClick={(event) => {
        tabs.removeTab(tabId);
        event.stopPropagation();
      }}
    >
      <MaterialIcon className="editor-tab-close">close</MaterialIcon>

      <div className="editor-tab-dirty"></div>
    </div>
  );
}
