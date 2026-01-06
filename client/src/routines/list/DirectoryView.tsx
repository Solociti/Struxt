import { RoutineListItem } from "common/models/routines/Routine";
import { DirectoryItem } from "./DirectoryItem";

export interface DirectoryNode {
  name: string;
  path: string;

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

      {files.map((file) => {
        const extension = file.name.includes(".")
          ? file.name.split(".").pop() || ""
          : "";

        return (
          <div
            key={file.uuid}
            className="d-flex align-items-center file-item"
            style={{ paddingLeft: level * 15, cursor: "pointer" }}
            onClick={() => handleEdit(file)}
          >
            <FileIcon extension={extension} />
            {file.name}
          </div>
        );
      })}
    </>
  );
}

function FileIcon({ extension }: { extension: string }) {
  let iconText = "";
  let iconColour = "lightblue";
  switch (extension) {
    case "js":
      iconColour = "orange";
      iconText = "JS";
      break;

    case "json":
      iconText = "{ }";
      iconColour = "orange";
      break;

    case "html":
      iconText = "</>";
      iconColour = "yellow";
      break;

    default:
      iconText = extension.substring(0, 4).toUpperCase();
  }

  return (
    <div style={{ width: "1.75em" }}>
      {iconText ? (
        <svg viewBox="0 0 120 75" style={{ width: "100%" }}>
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill={iconColour}
            fontSize="45"
            fontWeight="bold"
          >
            {iconText}
          </text>
        </svg>
      ) : (
        <svg viewBox="0 0 120 75" style={{ width: "100%" }}>
          <rect x="25" y="15" width="60" height="8" rx="4" fill={iconColour} />
          <rect x="25" y="30" width="25" height="8" rx="4" fill={iconColour} />
          <rect x="25" y="45" width="54" height="8" rx="4" fill={iconColour} />
          <rect x="25" y="60" width="35" height="8" rx="4" fill={iconColour} />
        </svg>
      )}
    </div>
  );
}
