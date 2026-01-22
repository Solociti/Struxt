import { AssetListItem } from "common/models/assets/AssetModel";
import { DirectoryItem } from "./DirectoryItem";
import { FileIcon } from "./FileIcon";

export interface DirectoryNode {
  name: string;
  path: string;

  defaultOpen?: boolean;

  subDirectories: Record<string, DirectoryNode>;
  files: AssetListItem[];
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
  handleEdit: (item: AssetListItem) => void;
}) {
  const dirs = Object.values(node.subDirectories).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const files = node.files.sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );

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

      {files.map((file) => {
        const extension = file.displayName.includes(".")
          ? file.displayName.split(".").pop() || ""
          : "";

        return (
          <div
            key={file.uuid}
            className="d-flex align-items-center file-item"
            style={{ paddingLeft: level * 15, cursor: "pointer" }}
            onClick={() => handleEdit(file)}
          >
            <FileIcon extension={extension} />
            {file.displayName}
          </div>
        );
      })}
    </>
  );
}
