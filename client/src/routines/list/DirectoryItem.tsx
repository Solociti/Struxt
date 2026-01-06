import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import { RoutineListItem } from "common/models/routines/Routine";
import { useState } from "react";
import Collapse from "react-bootstrap/Collapse";
import { DirectoryNode, DirectoryView } from "./DirectoryView";
import { NewRoutineModal } from "./NewRoutineModal";

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
  handleEdit,
}: {
  dir: DirectoryNode;
  level: number;
  defaultOpen?: boolean;
  handleEdit: (item: RoutineListItem) => void;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  const [showNew, setShowNew] = useState(false);
  const [newBasePath, setNewBasePath] = useState("");

  return (
    <div className="dir-section">
      <div
        className="d-flex align-items-center dir-item"
        style={{ paddingLeft: level * 15, cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        <MaterialIcon className="me-2" filled>
          {open ? "folder_open" : "folder"}
        </MaterialIcon>
        {dir.name}

        <div className="d-flex flex-grow-1 justify-content-end modify-dir-btns">
          <IconButton
            variant=""
            size="sm"
            className="p-0"
            icon="note_add"
            onClick={(event) => {
              event.stopPropagation();

              // show the modal to create a new file
              setShowNew(true);
              setNewBasePath(dir.path);
            }}
          />
        </div>
      </div>
      <NewRoutineModal
        show={showNew}
        onHide={() => setShowNew(false)}
        defaultPath={newBasePath}
      />

      <Collapse in={open}>
        <div
          className="dir-children-container"
          style={{ position: "relative" }}
        >
          <div
            className="dir-hover-guide"
            style={{
              position: "absolute",
              left: level * 20 + 11,
              top: 0,
              bottom: 0,
              width: "1px",
            }}
          />
          <DirectoryView node={dir} level={level + 1} handleEdit={handleEdit} />
        </div>
      </Collapse>
    </div>
  );
}
