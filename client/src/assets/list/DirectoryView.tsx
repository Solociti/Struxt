import { AssetListItem } from "common/models/assets/AssetModel";
import { useContentManager } from "../cm/contentManager";
import { DirectoryItem } from "./DirectoryItem";
import { FileIcon } from "./FileIcon";

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
}: {
  node: DirectoryNode;
  level: number;
}) {
  const { commands } = useContentManager();

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
        />
      ))}

      {files.map((file) => {
        const extension = file.displayName.includes(".")
          ? file.displayName.split(".").pop() || ""
          : "";

        return (
          <div
            key={file.uuid}
            className="d-flex align-items-center file-item text-truncate"
            style={{ paddingLeft: level * FILE_OFFSET, cursor: "pointer" }}
            title={file.displayName}
            onClick={() => commands.trigger("tabs:open", file)}
            onContextMenu={(event) => {
              event.preventDefault();
              commands.trigger("context-menu:show", event.currentTarget, file);
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
