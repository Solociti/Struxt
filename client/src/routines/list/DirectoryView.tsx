import MaterialIcon from "client/components/MaterialIcon";
import { RoutineListItem } from "common/models/routines/Routine";
import { DirectoryItem } from "./DirectoryItem";

export interface DirectoryNode {
  name: string;
  defaultOpen?: boolean;

  subDirectories: Record<string, DirectoryNode>;
  files: RoutineListItem[];
}

/**
 * Renders the directory tree recursively.
 *
 * @param props
 * @param props.node
 * @param props.level The current indentation level.
 * @param props.handleOpen Callback to open a file
 */
export function DirectoryView({
  node,
  level,
  handleEdit,
}: {
  node: DirectoryNode;
  level: number;
  handleEdit: (item: RoutineListItem) => void;
}) {
  const dirs = Object.values(node.subDirectories).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const files = node.files.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {dirs.map((dir) => (
        <DirectoryItem
          key={dir.name}
          dir={dir}
          level={level}
          defaultOpen={dir.defaultOpen}
          handleEdit={handleEdit}
        />
      ))}

      {files.map((file) => (
        <div
          key={file.uuid}
          className="d-flex align-items-center file-item"
          style={{ paddingLeft: level * 15, cursor: "pointer" }}
          onClick={() => handleEdit(file)}
        >
          <MaterialIcon className="me-2">javascript</MaterialIcon>
          {file.name}
        </div>
      ))}
    </>
  );
}
