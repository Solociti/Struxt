import { AssetListItem } from "common/models/assets/AssetModel";
import { DirectoryItem } from "./DirectoryItem";
import { FileIcon } from "./FileIcon";

import "./dir.scss";

export const FILE_OFFSET = 10;

export interface DirectoryNode {
  name: string;
  path: string;

  defaultOpen?: boolean;
  isExternalSrc?: boolean;
  preventNewFile?: boolean;

  subDirectories: Record<string, DirectoryNode>;
  files: AssetListItem[];
}

export interface DirectoryCommonProps {
  onClick: (file: AssetListItem) => void;
  onContextMenu: (
    item: DirectoryNode | AssetListItem,
    target: HTMLElement,
  ) => void;

  onDirClick?: (dir: DirectoryNode) => void;

  showNewFileBtn: boolean;

  /**
   * For directories, it's the path.
   * For files, it's the UUID.
   */
  selected: string[];
}

interface DirectoryViewProps extends DirectoryCommonProps {
  node: DirectoryNode;
  level: number;
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
  level,
  node,
  ...commonProps
}: DirectoryViewProps) {
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
          {...commonProps}
        />
      ))}

      {files.map((file) => {
        const extension = file.displayName.includes(".")
          ? file.displayName.split(".").pop() || ""
          : "";

        const isSelected = commonProps.selected.includes(file.uuid);

        return (
          <div
            key={file.uuid}
            className={`d-flex align-items-center file-item text-truncate rounded ${isSelected ? "selected" : ""}`}
            style={{ paddingLeft: level * FILE_OFFSET, cursor: "pointer" }}
            title={file.displayName}
            onClick={() => commonProps.onClick(file)}
            onContextMenu={(event) => {
              event.preventDefault();
              commonProps.onContextMenu(file, event.currentTarget);
            }}
          >
            <FileIcon extension={extension} />
            <div className="text-truncate">{file.displayName.slice(0, -6)}</div>
            <div>{file.displayName.slice(-6)}</div>
          </div>
        );
      })}
    </>
  );
}
