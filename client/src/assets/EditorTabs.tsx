import MaterialIcon from "client/components/MaterialIcon";
import { centerTruncateText } from "common/format/text";
import { AssetModel } from "common/models/assets/AssetModel";
import { getFileExtension } from "common/path/FileExtensions";
import Nav from "react-bootstrap/Nav";
import { useContentManager } from "./cm/contentManager";
import { FileIcon } from "./list/FileIcon";

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
      activeKey={activeTab?.item.uuid || ""}
      onSelect={(uuid) => {
        if (uuid) {
          tabs.setActiveTab(uuid);
        }
      }}
    >
      <style>
        {`
          .editor-tab-item .editor-tab-status-wrapper {
            position: relative;
            width: 1.2rem;
            height: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .editor-tab-item .editor-tab-dirty {
            position: absolute;
            transition: opacity 0.2s;
            opacity: 0;
            width: 0.5em;
            height: 0.5em;
            border-radius: 50%;
            background-color: #b3b3b3;
            border: 1px solid #949494;
          }
          .editor-tab-item .editor-tab-close {
            position: absolute;
            font-size: 1.15em;
            opacity: 0;
            transition: opacity 0.2s;
            margin-top: 0.1em;
          }

          /* Dirty Logic: Show when dirty AND not hovered */
          .editor-tab-item.dirty:not(:hover) .editor-tab-dirty {
            opacity: 1;
          }

          /* Close Logic: Show on hover OR (Active AND Not Dirty) */
          .editor-tab-item:hover .editor-tab-close,
          .editor-tab-item.active:not(.dirty) .editor-tab-close {
            opacity: 0.8;
          }
          .editor-tab-item.active:not(.dirty) .editor-tab-close {
            opacity: 1;
          }
        `}
      </style>

      {list.map((tab) => {
        const { item, isDirty } = tab;

        const fileName = AssetModel.getFileName(item.path);
        const extension = getFileExtension(fileName);

        return (
          <Nav.Item key={item.uuid}>
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

              <div
                className="d-flex justify-content-center cursor-pointer ms-1 editor-tab-status-wrapper"
                title={isDirty ? "Unsaved Changes" : ""}
                onClick={(event) => {
                  tabs.removeTab(item.uuid);
                  event.stopPropagation();
                }}
              >
                <MaterialIcon className="editor-tab-close">close</MaterialIcon>

                <div className="editor-tab-dirty"></div>
              </div>
            </Nav.Link>
          </Nav.Item>
        );
      })}
    </Nav>
  );
}
