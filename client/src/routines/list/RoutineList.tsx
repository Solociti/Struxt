import { useLoadAsync } from "client/api/useLoadAsync";
import { ShowError } from "client/components/ShowError";
import { RoutineListItem } from "common/models/routines/Routine";
import { useMemo } from "react";
import Spinner from "react-bootstrap/Spinner";
import { DirectoryNode, DirectoryView } from "./DirectoryView";
import { getRoutineList } from "./routineApis";

interface RoutinesListProps {
  projectId: string;

  /**
   * Callback to handle when an item is opened
   *
   * @param item
   * @returns
   */
  handleEdit: (item: RoutineListItem) => void;
}

export function RoutineList({ projectId, handleEdit }: RoutinesListProps) {
  // load the list of routines
  const {
    response: routineList,
    isLoading: loadingList,
    error: listError,
  } = useLoadAsync(async () => {
    if (projectId === "*") {
      return null;
    }

    return await getRoutineList(projectId);
  }, [projectId]);

  const fileTree = useMemo(() => {
    if (!routineList) return null;
    const root: DirectoryNode = {
      name: "root",
      path: "/",
      subDirectories: {
        public: {
          files: [],
          subDirectories: {},
          name: "public",
          path: "/public/",
          defaultOpen: true,
        },
        routines: {
          files: [],
          subDirectories: {},
          name: "routines",
          path: "/routines/",
          defaultOpen: true,
        },
      },
      files: [],
    };

    for (const item of routineList) {
      const parts = item.path.split("/").filter((p) => p);
      let current = root;
      for (const part of parts) {
        if (!current.subDirectories[part]) {
          current.subDirectories[part] = {
            name: part,
            path: item.path,
            subDirectories: {},
            files: [],
          };
        }
        current = current.subDirectories[part];
      }
      current.files.push(item);
    }

    return root;
  }, [routineList]);

  return (
    <div
      style={{ width: "200px", overflowY: "auto" }}
      className="h-100 border-end p-3"
    >
      <style>
        {`          
          .dir-hover-guide {
            background-color: transparent;
            transition: background-color 0.1s;
            margin-top: 5px;
            margin-bottom: 5px;
            margin-left: -5px;
          }
          .dir-section:hover > .dir-children-container > .dir-hover-guide {
            background-color: rgba(103, 103, 103, 0.5);
          }
          
          .dir-item > .modify-dir-btns {
            opacity: 0;
            transition: opacity 0.1s;
          }
          .dir-item:hover > .modify-dir-btns {
            opacity: 1;
          }
          .file-item:hover, .dir-item:hover {
            background-color: rgba(103, 103, 103, 0.1);
          }
        `}
      </style>
      <ShowError error={listError} />

      {loadingList && <Spinner animation="border" size="sm" />}

      {/* ICONS: folder = directory, folder_open = open directory, javascript = files, note_add = new file */}

      <div>
        {fileTree && (
          <DirectoryView node={fileTree} level={0} handleEdit={handleEdit} />
        )}
      </div>
    </div>
  );
}
