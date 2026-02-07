import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import { useState } from "react";
import Collapse from "react-bootstrap/Collapse";
import { useContentManager } from "../cm/contentManager";
import {
  DirectoryCommonProps,
  DirectoryNode,
  DirectoryView,
  FILE_OFFSET,
} from "./DirectoryView";

interface DirectoryItemProps extends DirectoryCommonProps {
  dir: DirectoryNode;
  level: number;
  defaultOpen?: boolean;
}

/**
 * Renders a single directory item with collapse functionality.
 * @param props
 * @param props.dir
 * @param props.level The indentation level.
 * @param props.defaultOpen
 */
export function DirectoryItem({
  dir,
  level,
  defaultOpen,
  ...commonProps
}: DirectoryItemProps) {
  const { commands } = useContentManager();

  const [open, setOpen] = useState(Boolean(defaultOpen));
  const isSelected = commonProps.selected.includes(dir.path);

  return (
    <div className="dir-section">
      <div
        className={`d-flex align-items-center dir-item rounded ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: level * FILE_OFFSET, cursor: "pointer" }}
        onClick={() => {
          setOpen(!open);
          commonProps.onDirClick?.(dir);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          commonProps.onContextMenu(dir, event.currentTarget);
        }}
      >
        <MaterialIcon className="me-2" filled>
          {open ? "folder_open" : "folder"}
        </MaterialIcon>
        {dir.name}

        <div className="d-flex flex-grow-1 justify-content-end modify-dir-btns">
          {commonProps.showNewFileBtn && !dir.preventNewFile && (
            <IconButton
              variant=""
              size="sm"
              className="p-0"
              icon="note_add"
              onClick={(event) => {
                event.stopPropagation();

                commands.trigger("new-asset:show", dir.path);
              }}
            />
          )}
        </div>
      </div>

      <Collapse in={open}>
        <div
          className="dir-children-container"
          style={{ position: "relative" }}
        >
          <div
            className="dir-hover-guide"
            style={{
              position: "absolute",
              left: level * FILE_OFFSET + 11,
              top: 0,
              bottom: 0,
              width: "1px",
            }}
          />
          <DirectoryView node={dir} level={level + 1} {...commonProps} />
        </div>
      </Collapse>
    </div>
  );
}
